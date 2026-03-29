"use client";

/**
 * FaceLivenessKYC — Vérification d'identité par reconnaissance faciale
 *
 * Flux :
 *   1. Consentement explicite (aucune donnée stockée)
 *   2. Photo CNI → détection visage + OCR nom (face-api.js + tesseract.js)
 *   3. Caméra live → détection en temps réel → auto-capture stable
 *   4. Comparaison descripteurs faciaux (euclidean distance)
 *   5. Résultat → callback onSuccess (score uniquement, pas de photo)
 *
 * Privacy-by-design :
 *   - Traitement 100 % dans le navigateur (aucune image envoyée au serveur)
 *   - Seul le résultat (score + booléen) est persisté
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Camera,
    Upload,
    Shield,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    RefreshCw,
    Lock,
    UserCheck,
    FileImage,
    Eye,
    ChevronRight,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

export interface KYCResult {
    faceMatchScore: number;       // 0–1
    nameMatch: boolean;
    verified: boolean;
    extractedName?: string;
    confidence: "high" | "medium" | "low";
}

interface FaceLivenessKYCProps {
    expectedName: string;
    onSuccess: (result: KYCResult) => void;
    onSkip?: () => void;
}

type KYCStep =
    | "consent"
    | "capture-id"
    | "processing-id"
    | "liveness"
    | "comparing"
    | "result";

// ── Constants ──────────────────────────────────────────────────────────────

// Modèles servis localement depuis /public/models/face-api (pas de CDN externe)
const MODEL_URL = "/models/face-api";
const FACEAPI_SCRIPT = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
const FACE_THRESHOLD = 0.55;      // < threshold = même personne
const STABLE_FRAMES = 25;         // ~1 s à 25 fps avant capture auto

// ── Charger face-api.js via script tag (contourne Turbopack/webpack) ────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _fa: any = null;
let _loaded = false;
let _loading = false;

function loadScriptOnce(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Impossible de charger le script : ${src}`));
        document.head.appendChild(s);
    });
}

async function getFaceAPI() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (_loaded && _fa) return _fa as any;
    if (_loading) {
        while (_loading) await new Promise((r) => setTimeout(r, 100));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (_fa && _loaded) return _fa as any;
        throw new Error("Chargement des modèles interrompu");
    }
    _loading = true;
    _fa = null;
    _loaded = false;
    try {
        // 1. Charger la lib via <script> tag → window.faceapi
        await loadScriptOnce(FACEAPI_SCRIPT);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fa = (window as any).faceapi;
        if (!fa) throw new Error("window.faceapi non disponible après chargement du script");
        _fa = fa;

        // 2. Charger les modèles depuis /public/models/face-api (même origine)
        await Promise.all([
            fa.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            fa.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
            fa.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        _loaded = true;
        return fa;
    } catch (err) {
        _fa = null;
        _loaded = false;
        throw err;
    } finally {
        _loading = false;
    }
}

// ── Charger une image dans un canvas (évite les race conditions data URL) ──

async function imageToCanvas(src: string): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext("2d")!.drawImage(img, 0, 0);
            resolve(canvas);
        };
        img.onerror = () => reject(new Error("Impossible de lire l'image de la CNI"));
        // Affecter src APRÈS les handlers pour éviter la race condition data URL
        img.src = src;
        // Sécurité : si l'image est déjà en cache et complete
        if (img.complete && img.naturalWidth > 0) {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext("2d")!.drawImage(img, 0, 0);
            resolve(canvas);
        }
    });
}

// ── OCR name extractor ─────────────────────────────────────────────────────

function normalise(s: string) {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function compareNames(
    ocrText: string,
    expected: string
): { match: boolean; extracted: string } {
    const normOcr = normalise(ocrText);
    const normExpected = normalise(expected);
    const tokens = normExpected.split(" ").filter((t) => t.length > 1);
    if (!tokens.length) return { match: false, extracted: "" };

    const matched = tokens.filter((t) => normOcr.includes(t));
    const ratio = matched.length / tokens.length;

    // Essayer d'extraire le nom/prénom depuis la CNI camerounaise
    const nomRe = /(?:NOM|NOM ET PRÉNOM|NOM\/PRÉNOMS?)\s*[:\/]?\s*([A-Z][A-Z\s\-]+?)(?:\n|$)/i;
    const prenomRe = /(?:PRÉNOM|PRÉNOMS?)\s*[:\/]?\s*([A-Z][A-Z\s\-]+?)(?:\n|$)/i;
    const nomMatch = ocrText.match(nomRe);
    const prenomMatch = ocrText.match(prenomRe);
    const extracted = [prenomMatch?.[1], nomMatch?.[1]]
        .filter(Boolean)
        .map((s) => s?.trim())
        .join(" ")
        .trim();

    return { match: ratio >= 0.6, extracted };
}

// ── Progress ring SVG ──────────────────────────────────────────────────────

function ProgressRing({ progress }: { progress: number }) {
    const r = 54;
    const circ = 2 * Math.PI * r;
    const dash = circ * progress;
    return (
        <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 120 120"
            aria-hidden
        >
            <circle cx="60" cy="60" r={r} fill="none" stroke="white/10" strokeWidth="4" />
            <circle
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke="#22c55e"
                strokeWidth="4"
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.1s linear" }}
            />
        </svg>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
//  Main Component
// ══════════════════════════════════════════════════════════════════════════════

export function FaceLivenessKYC({
    expectedName,
    onSuccess,
    onSkip,
}: FaceLivenessKYCProps) {
    const [step, setStep] = useState<KYCStep>("consent");
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState("");
    const [kycResult, setKycResult] = useState<KYCResult | null>(null);

    // CNI
    const [idImageSrc, setIdImageSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Camera
    const videoRef = useRef<HTMLVideoElement>(null);
    const captureCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number>(0);
    const stepRef = useRef<KYCStep>("consent");

    // Detection state
    const [faceInFrame, setFaceInFrame] = useState(false);
    const [captureProgress, setCaptureProgress] = useState(0);
    const stableCount = useRef(0);

    // Stored descriptors
    const idDescriptor = useRef<Float32Array | null>(null);
    const nameResult = useRef<{ match: boolean; extracted: string }>({
        match: false,
        extracted: "",
    });

    // Keep stepRef in sync
    useEffect(() => {
        stepRef.current = step;
    }, [step]);

    // Stop camera on unmount
    const stopCamera = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }, []);

    useEffect(() => () => stopCamera(), [stopCamera]);

    // ── Handlers ──────────────────────────────────────────────────────────

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setIdImageSrc(ev.target?.result as string);
        reader.readAsDataURL(file);
    }

    async function processIdCard() {
        if (!idImageSrc) return;
        setStep("processing-id");
        setError(null);

        try {
            // ── Étape 1 : chargement des modèles ──────────────────────────
            setProgress("Chargement des modèles IA… (première utilisation ~10 s)");
            let faceapi: Awaited<ReturnType<typeof getFaceAPI>>;
            try {
                faceapi = await getFaceAPI();
            } catch (err) {
                console.error("[KYC] Chargement modèles échoué:", err);
                setError(
                    "Impossible de charger les modèles IA. Vérifiez votre connexion internet et réessayez."
                );
                setStep("capture-id");
                return;
            }

            // ── Étape 2 : conversion image → canvas ───────────────────────
            setProgress("Lecture de l'image CNI…");
            let idCanvas: HTMLCanvasElement;
            try {
                idCanvas = await imageToCanvas(idImageSrc);
            } catch (err) {
                console.error("[KYC] Chargement image échoué:", err);
                setError("Impossible de lire l'image. Réessayez avec une photo différente.");
                setStep("capture-id");
                return;
            }

            // ── Étape 3 : détection visage sur le canvas ──────────────────
            setProgress("Détection du visage sur la CNI…");
            let det: Awaited<ReturnType<typeof faceapi.detectSingleFace>> | undefined;
            try {
                det = await faceapi
                    .detectSingleFace(
                        idCanvas,
                        new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.25 })
                    )
                    .withFaceLandmarks(true)
                    .withFaceDescriptor();
            } catch (err) {
                console.error("[KYC] Face detection échouée:", err);
                setError(
                    "Erreur lors de la détection faciale. Assurez-vous que votre navigateur supporte WebGL."
                );
                setStep("capture-id");
                return;
            }

            if (!det) {
                setError(
                    "Aucun visage détecté sur la CNI. Assurez-vous que la photo est nette, bien éclairée et non floutée."
                );
                setStep("capture-id");
                return;
            }
            idDescriptor.current = det.descriptor;

            // ── Étape 4 : OCR nom (optionnel) ─────────────────────────────
            try {
                setProgress("Lecture du nom sur la CNI (OCR)…");
                const { createWorker } = await import("tesseract.js");
                const worker = await createWorker("fra", 1, { logger: () => {} });
                const { data: { text } } = await worker.recognize(idCanvas);
                await worker.terminate();
                nameResult.current = compareNames(text, expectedName);
            } catch {
                // OCR non bloquant
                nameResult.current = { match: false, extracted: "" };
            }

            setProgress("Visage détecté ✓");
            setStep("liveness");
            await startCamera();

        } catch (err) {
            console.error("[KYC] Erreur inattendue dans processIdCard:", err);
            setError("Erreur inattendue. Réessayez.");
            setStep("capture-id");
        }
    }

    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                runFaceTracking();
            }
        } catch {
            setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
            setStep("capture-id");
        }
    }

    function runFaceTracking() {
        const faceapi = _fa;
        if (!faceapi) return;

        const tick = async () => {
            const video = videoRef.current;
            const overlay = overlayCanvasRef.current;
            if (!video || !overlay || stepRef.current !== "liveness") return;
            if (video.readyState < 2) {
                rafRef.current = requestAnimationFrame(tick);
                return;
            }

            overlay.width = video.videoWidth;
            overlay.height = video.videoHeight;
            const ctx = overlay.getContext("2d")!;
            ctx.clearRect(0, 0, overlay.width, overlay.height);

            const det = await faceapi.detectSingleFace(
                video,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
            );

            if (det) {
                const { x, y, width, height } = det.box;
                const cx = x + width / 2;
                const cy = y + height / 2;
                const isCentered =
                    Math.abs(cx - overlay.width / 2) < overlay.width * 0.2 &&
                    Math.abs(cy - overlay.height / 2) < overlay.height * 0.2 &&
                    width > overlay.width * 0.12;

                ctx.strokeStyle = isCentered ? "#22c55e" : "#f97316";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.roundRect(x, y, width, height, 8);
                ctx.stroke();

                setFaceInFrame(true);

                if (isCentered) {
                    stableCount.current = Math.min(stableCount.current + 1, STABLE_FRAMES);
                } else {
                    stableCount.current = Math.max(0, stableCount.current - 2);
                }

                const prog = stableCount.current / STABLE_FRAMES;
                setCaptureProgress(prog);

                if (stableCount.current >= STABLE_FRAMES) {
                    await captureSelfie();
                    return;
                }
            } else {
                stableCount.current = Math.max(0, stableCount.current - 1);
                setCaptureProgress(stableCount.current / STABLE_FRAMES);
                setFaceInFrame(false);
            }

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
    }

    async function captureSelfie() {
        const video = videoRef.current;
        const canvas = captureCanvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")!.drawImage(video, 0, 0);

        stopCamera();
        setStep("comparing");
        await runComparison(canvas);
    }

    async function runComparison(selfieCanvas: HTMLCanvasElement) {
        const faceapi = _fa;
        if (!faceapi || !idDescriptor.current) {
            setError("Session expirée. Recommencez la vérification.");
            setStep("capture-id");
            return;
        }

        try {
            const selfDet = await faceapi
                .detectSingleFace(
                    selfieCanvas,
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 })
                )
                .withFaceLandmarks(true)
                .withFaceDescriptor();

            if (!selfDet) {
                setError("Visage non détecté dans la capture. Réessayez face à la caméra.");
                setStep("capture-id");
                return;
            }

            const dist = faceapi.euclideanDistance(
                idDescriptor.current,
                selfDet.descriptor
            );

            const faceMatchScore = Math.max(0, Math.min(1, 1 - dist / 1.2));
            const facesMatch = dist < FACE_THRESHOLD;
            // Si OCR a échoué, on ne pénalise pas sur le nom
            const nameMatch =
                nameResult.current.match || !nameResult.current.extracted;
            const verified = facesMatch && nameMatch;

            const confidence: KYCResult["confidence"] =
                faceMatchScore > 0.78
                    ? "high"
                    : faceMatchScore > 0.6
                    ? "medium"
                    : "low";

            const result: KYCResult = {
                faceMatchScore,
                nameMatch,
                verified,
                extractedName: nameResult.current.extracted || undefined,
                confidence,
            };

            setKycResult(result);
            setStep("result");
        } catch (err) {
            console.error(err);
            setError("Erreur lors de la comparaison. Réessayez.");
            setStep("capture-id");
        }
    }

    function retry() {
        idDescriptor.current = null;
        nameResult.current = { match: false, extracted: "" };
        stableCount.current = 0;
        setIdImageSrc(null);
        setFaceInFrame(false);
        setCaptureProgress(0);
        setKycResult(null);
        setError(null);
        setStep("capture-id");
    }

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="w-full max-w-lg mx-auto">
            <AnimatePresence mode="wait">
                {step === "consent" && (
                    <ConsentStep
                        key="consent"
                        onAccept={() => setStep("capture-id")}
                        onSkip={onSkip}
                    />
                )}

                {step === "capture-id" && (
                    <CaptureIdStep
                        key="capture-id"
                        error={error}
                        idImageSrc={idImageSrc}
                        fileInputRef={fileInputRef}
                        onFileChange={handleFileChange}
                        onContinue={processIdCard}
                    />
                )}

                {step === "processing-id" && (
                    <ProcessingStep key="processing-id" message={progress || "Traitement en cours…"} />
                )}

                {step === "liveness" && (
                    <LivenessStep
                        key="liveness"
                        videoRef={videoRef}
                        overlayCanvasRef={overlayCanvasRef}
                        captureCanvasRef={captureCanvasRef}
                        faceInFrame={faceInFrame}
                        captureProgress={captureProgress}
                    />
                )}

                {step === "comparing" && (
                    <ProcessingStep key="comparing" message="Comparaison des visages…" />
                )}

                {step === "result" && kycResult && (
                    <ResultStep
                        key="result"
                        result={kycResult}
                        expectedName={expectedName}
                        onSuccess={() => onSuccess(kycResult)}
                        onRetry={retry}
                    />
                )}
            </AnimatePresence>

            {/* Hidden elements */}
            <canvas ref={captureCanvasRef} className="hidden" />
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
//  Step sub-components
// ══════════════════════════════════════════════════════════════════════════════

function ConsentStep({
    onAccept,
    onSkip,
}: {
    onAccept: () => void;
    onSkip?: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="bg-surface-900 rounded-2xl border border-white/8 p-6 space-y-6"
        >
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 mb-4">
                    <Shield size={26} className="text-emerald-400" />
                </div>
                <h2 className="text-lg font-bold text-white mb-1">
                    Vérification d'identité
                </h2>
                <p className="text-surface-400 text-sm">
                    Obligatoire pour les agriculteurs individuels
                </p>
            </div>

            <div className="space-y-3">
                {[
                    {
                        icon: <FileImage size={16} />,
                        title: "Photo de votre CNI",
                        desc: "Nous détectons votre visage et votre nom",
                    },
                    {
                        icon: <Camera size={16} />,
                        title: "Caméra frontale",
                        desc: "Comparaison en temps réel avec la CNI",
                    },
                    {
                        icon: <Lock size={16} />,
                        title: "Aucune donnée stockée",
                        desc: "Traitement local — seul le résultat (oui/non) est conservé",
                    },
                    {
                        icon: <Eye size={16} />,
                        title: "Transparence totale",
                        desc: "Conforme à la loi camerounaise n°2017/012",
                    },
                ].map(({ icon, title, desc }) => (
                    <div
                        key={title}
                        className="flex items-start gap-3 p-3 rounded-xl bg-white/4 border border-white/6"
                    >
                        <span className="mt-0.5 text-emerald-400 shrink-0">{icon}</span>
                        <div>
                            <p className="text-white text-sm font-medium">{title}</p>
                            <p className="text-surface-400 text-xs mt-0.5">{desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-2">
                <button
                    onClick={onAccept}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                    <UserCheck size={18} />
                    J'accepte et je continue
                </button>
                {onSkip && (
                    <button
                        onClick={onSkip}
                        className="w-full py-2 text-surface-500 hover:text-surface-300 text-xs transition-colors"
                    >
                        Passer cette étape (vérification manuelle par notre équipe)
                    </button>
                )}
            </div>
        </motion.div>
    );
}

function CaptureIdStep({
    error,
    idImageSrc,
    fileInputRef,
    onFileChange,
    onContinue,
}: {
    error: string | null;
    idImageSrc: string | null;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onContinue: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="bg-surface-900 rounded-2xl border border-white/8 p-6 space-y-5"
        >
            <div className="text-center">
                <h2 className="text-lg font-bold text-white mb-1">
                    Photo de votre CNI
                </h2>
                <p className="text-surface-400 text-sm">
                    Prenez en photo votre Carte Nationale d'Identité côté recto (face avec photo)
                </p>
            </div>

            {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    {error}
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onFileChange}
            />

            {idImageSrc ? (
                <div className="relative rounded-xl overflow-hidden border border-emerald-500/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={idImageSrc}
                        alt="CNI capturée"
                        className="w-full object-contain max-h-52"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-3 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Photo capturée
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 rounded-xl border-2 border-dashed border-white/15 hover:border-emerald-500/50 bg-white/3 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-3 text-surface-400 hover:text-emerald-400"
                >
                    <Upload size={28} />
                    <span className="text-sm font-medium">
                        Appuyer pour prendre une photo
                    </span>
                    <span className="text-xs opacity-70">
                        CNI recto — face avec votre photo
                    </span>
                </button>
            )}

            {idImageSrc && (
                <div className="space-y-2">
                    <button
                        onClick={onContinue}
                        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                    >
                        Analyser la CNI
                        <ChevronRight size={18} />
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 text-surface-500 hover:text-surface-300 text-xs transition-colors flex items-center justify-center gap-1"
                    >
                        <RefreshCw size={12} />
                        Reprendre la photo
                    </button>
                </div>
            )}

            {!idImageSrc && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-amber-300 text-xs">
                        💡 <strong>Conseil :</strong> Placez la CNI sur une surface plane,
                        bien éclairée. Évitez les reflets.
                    </p>
                </div>
            )}
        </motion.div>
    );
}

function ProcessingStep({ message }: { message: string }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-surface-900 rounded-2xl border border-white/8 p-10 flex flex-col items-center gap-5"
        >
            <div className="relative">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                    <Loader2 size={28} className="text-emerald-400 animate-spin" />
                </div>
            </div>
            <div className="text-center">
                <p className="text-white font-semibold">{message}</p>
                <p className="text-surface-400 text-xs mt-1">
                    Traitement local — aucune donnée envoyée
                </p>
            </div>
        </motion.div>
    );
}

function LivenessStep({
    videoRef,
    overlayCanvasRef,
    captureCanvasRef,
    faceInFrame,
    captureProgress,
}: {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    captureCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    faceInFrame: boolean;
    captureProgress: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="bg-surface-900 rounded-2xl border border-white/8 p-6 space-y-4"
        >
            <div className="text-center">
                <h2 className="text-lg font-bold text-white mb-1">
                    Vérification en direct
                </h2>
                <p className="text-surface-400 text-sm">
                    {faceInFrame
                        ? captureProgress > 0.5
                            ? "Parfait, restez immobile…"
                            : "Centrez votre visage dans le cadre"
                        : "Placez votre visage devant la caméra"}
                </p>
            </div>

            {/* Camera feed with overlay */}
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                />
                <canvas
                    ref={overlayCanvasRef}
                    className="absolute inset-0 w-full h-full scale-x-[-1]"
                />

                {/* Progress ring in center */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-36 h-36">
                        <ProgressRing progress={captureProgress} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white/60 text-xs font-medium">
                                {captureProgress >= 1
                                    ? "✓"
                                    : `${Math.round(captureProgress * 100)}%`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Status badge */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                    <div
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm ${
                            faceInFrame
                                ? "bg-emerald-500/80 text-white"
                                : "bg-black/60 text-surface-300"
                        }`}
                    >
                        <div
                            className={`w-1.5 h-1.5 rounded-full ${
                                faceInFrame ? "bg-white animate-pulse" : "bg-surface-500"
                            }`}
                        />
                        {faceInFrame ? "Visage détecté" : "En attente…"}
                    </div>
                </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/15">
                <p className="text-emerald-300 text-xs text-center">
                    📷 La capture se fera automatiquement quand votre visage sera stabilisé
                </p>
            </div>
        </motion.div>
    );
}

function ResultStep({
    result,
    expectedName,
    onSuccess,
    onRetry,
}: {
    result: KYCResult;
    expectedName: string;
    onSuccess: () => void;
    onRetry: () => void;
}) {
    const scorePercent = Math.round(result.faceMatchScore * 100);

    const isGood = result.verified && result.confidence !== "low";
    const isPartial = !result.verified && result.faceMatchScore > 0.5;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-surface-900 rounded-2xl border border-white/8 p-6 space-y-5"
        >
            <div className="text-center">
                {isGood ? (
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-3">
                        <CheckCircle2 size={32} className="text-emerald-400" />
                    </div>
                ) : isPartial ? (
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 mb-3">
                        <AlertTriangle size={32} className="text-amber-400" />
                    </div>
                ) : (
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 mb-3">
                        <XCircle size={32} className="text-red-400" />
                    </div>
                )}

                <h2 className="text-lg font-bold text-white mb-1">
                    {isGood
                        ? "Identité vérifiée ✓"
                        : isPartial
                        ? "Vérification partielle"
                        : "Vérification échouée"}
                </h2>
                <p className="text-surface-400 text-sm">
                    {isGood
                        ? "Votre identité a été confirmée avec succès."
                        : isPartial
                        ? "Certains critères n'ont pas pu être validés."
                        : "La correspondance entre la CNI et votre visage est insuffisante."}
                </p>
            </div>

            {/* Score details */}
            <div className="space-y-2 p-4 rounded-xl bg-white/4 border border-white/6">
                <ScoreLine
                    label="Correspondance faciale"
                    value={`${scorePercent}%`}
                    ok={result.faceMatchScore > 0.6}
                    bar={result.faceMatchScore}
                />
                <ScoreLine
                    label="Correspondance du nom"
                    value={result.nameMatch ? "Correspondance ✓" : "Non déterminé"}
                    ok={result.nameMatch}
                />
                {result.extractedName && (
                    <div className="flex justify-between text-xs pt-1 border-t border-white/6">
                        <span className="text-surface-500">Nom extrait (CNI)</span>
                        <span className="text-surface-300 font-mono">
                            {result.extractedName}
                        </span>
                    </div>
                )}
                <div className="flex justify-between text-xs pt-1 border-t border-white/6">
                    <span className="text-surface-500">Nom attendu (système)</span>
                    <span className="text-surface-300 font-mono">{expectedName}</span>
                </div>
            </div>

            {isGood ? (
                <button
                    onClick={onSuccess}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                    <CheckCircle2 size={18} />
                    Continuer vers le tableau de bord
                </button>
            ) : (
                <div className="space-y-2">
                    <button
                        onClick={onRetry}
                        className="w-full py-3 rounded-xl bg-surface-700 hover:bg-surface-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={16} />
                        Réessayer la vérification
                    </button>
                    {isPartial && (
                        <button
                            onClick={onSuccess}
                            className="w-full py-2 text-amber-400 hover:text-amber-300 text-xs transition-colors text-center"
                        >
                            Continuer quand même (révision manuelle par notre équipe)
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
}

function ScoreLine({
    label,
    value,
    ok,
    bar,
}: {
    label: string;
    value: string;
    ok: boolean;
    bar?: number;
}) {
    return (
        <div>
            <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-surface-400">{label}</span>
                <span className={ok ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
                    {value}
                </span>
            </div>
            {bar !== undefined && (
                <div className="h-1 rounded-full bg-white/8">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${
                            ok ? "bg-emerald-500" : bar > 0.4 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${bar * 100}%` }}
                    />
                </div>
            )}
        </div>
    );
}
