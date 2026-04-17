"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    AlertCircle,
    ArrowLeft,
    CalendarClock,
    CheckCircle2,
    ChefHat,
    CreditCard,
    Loader2,
    Loader,
    MapPin,
    Navigation,
    Package,
    Gift,
    ShoppingBag,
    Smartphone,
    Utensils,
    Users,
    Zap,
} from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { formatCFA } from "@kbouffe/module-core/ui";
import { useRecentOrders } from "@/store/client-store";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────
type DeliveryType    = "delivery" | "pickup" | "dine_in";
type PaymentMethod   = "cash" | "mobile_money_mtn" | "mobile_money_orange" | "gift_card";

const SERVICE_FEE = 250;

const DELIVERY_FEES: Record<DeliveryType, number> = {
    delivery: 1000,
    pickup:   0,
    dine_in:  0,
};

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; desc: string; icon: React.ReactNode }[] = [
    {
        id:    "cash",
        label: "Paiement en espèces",
        desc:  "Réglez à la livraison / au retrait",
        icon:  <CreditCard size={20} />,
    },
    {
        id:    "mobile_money_mtn",
        label: "MTN Mobile Money",
        desc:  "Paiement via MTN MoMo",
        icon:  <Smartphone size={20} className="text-yellow-500" />,
    },
    {
        id:    "mobile_money_orange",
        label: "Orange Money",
        desc:  "Paiement via Orange Money",
        icon:  <Smartphone size={20} className="text-orange-500" />,
    },
    {
        id:    "gift_card",
        label: "Carte cadeau",
        desc:  "Payez totalement ou partiellement avec votre carte cadeau",
        icon:  <Gift size={20} className="text-emerald-500" />,
    },
];
const SPLIT_PAYMENT_OPTIONS = PAYMENT_OPTIONS.filter((opt) => opt.id !== "gift_card");

interface GiftCardValidation {
    gift_card_id: string;
    code: string;
    current_balance: number;
    amount_applicable: number;
    remaining_to_pay: number;
}

interface CheckoutDraft {
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    tableNumber?: string;
}

interface AddressRow {
    address: string | null;
    city: string | null;
    instructions: string | null;
    is_default: boolean | null;
}

const CHECKOUT_DRAFT_KEY = "kbouffe-store-checkout-draft-v1";

const DELIVERY_LABELS: Record<DeliveryType, string> = {
    delivery: "Livraison",
    pickup:   "À emporter",
    dine_in:  "Sur place",
};

function formatAddressRow(address: AddressRow): string {
    const parts: string[] = [];
    if (address.address?.trim()) parts.push(address.address.trim());
    if (address.city?.trim()) parts.push(address.city.trim());
    if (address.instructions?.trim()) parts.push(`Repère: ${address.instructions.trim()}`);
    return parts.join(", ");
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: "info" | "payment" | "review" }) {
    const steps: { id: "info" | "payment" | "review"; label: string }[] = [
        { id: "info",    label: "Coordonnées" },
        { id: "payment", label: "Paiement" },
        { id: "review",  label: "Confirmation" },
    ];
    const currentIdx = steps.findIndex((s) => s.id === step);

    return (
        <div className="flex items-center gap-0 mb-6">
            {steps.map((s, idx) => (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                        <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                idx < currentIdx
                                    ? "bg-brand-500 text-white"
                                    : idx === currentIdx
                                    ? "bg-brand-500 text-white ring-4 ring-brand-500/20"
                                    : "bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400"
                            }`}
                        >
                            {idx < currentIdx ? <CheckCircle2 size={14} /> : idx + 1}
                        </span>
                        <span className={`text-xs mt-1 font-medium ${idx === currentIdx ? "text-brand-600 dark:text-brand-400" : "text-surface-400"}`}>
                            {s.label}
                        </span>
                    </div>
                    {idx < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mb-4 mx-2 transition-colors ${idx < currentIdx ? "bg-brand-500" : "bg-surface-200 dark:bg-surface-700"}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function CheckoutPageClient() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const { restaurant, items, subtotal, clear } = useCart();
    const addOrder     = useRecentOrders((s) => s.addOrder);

    const deliveryType = (searchParams.get("deliveryType") as DeliveryType) ?? "delivery";
    const deliveryFee  = DELIVERY_FEES[deliveryType] ?? 0;
    const total        = subtotal + deliveryFee + SERVICE_FEE;

    // ── Form state ─────────────────────────────────────────────────────────
    const [step, setStep]                     = useState<"info" | "payment" | "review">("info");
    const [userId, setUserId]                 = useState<string | null>(null);
    const [customerName, setCustomerName]     = useState("");
    const [customerPhone, setCustomerPhone]   = useState("");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [tableNumber, setTableNumber]       = useState("");
    const [paymentMethod, setPaymentMethod]   = useState<PaymentMethod>("cash");
    const [submitting, setSubmitting]         = useState(false);
    const [error, setError]                   = useState<string | null>(null);
    const [isLocating, setIsLocating]         = useState(false);

    // ── Scheduled order state ────────────────────────────────────────────
    const [isScheduled, setIsScheduled]         = useState(false);
    const [scheduledDate, setScheduledDate]     = useState("");
    const [scheduledTime, setScheduledTime]     = useState("");

    // ── Split payment state ──────────────────────────────────────────────
    const [isSplitPayment, setIsSplitPayment] = useState(false);
    const [splitCount, setSplitCount]         = useState(2);
    const [splitDrafts, setSplitDrafts]       = useState<{ label: string; amount: string; method: PaymentMethod }[]>([]);
    const [giftCardCode, setGiftCardCode] = useState("");
    const [giftCardValidation, setGiftCardValidation] = useState<GiftCardValidation | null>(null);
    const [validatingGiftCard, setValidatingGiftCard] = useState(false);
    const [draftHydrated, setDraftHydrated] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const rawDraft = window.localStorage.getItem(CHECKOUT_DRAFT_KEY);
            if (!rawDraft) return;
            const draft = JSON.parse(rawDraft) as CheckoutDraft;

            if (draft.customerName?.trim()) {
                const name = draft.customerName.trim();
                setCustomerName((prev) => prev.trim() || name);
            }
            if (draft.customerPhone?.trim()) {
                const phone = draft.customerPhone.trim();
                setCustomerPhone((prev) => prev.trim() || phone);
            }
            if (deliveryType === "delivery" && draft.deliveryAddress?.trim()) {
                const address = draft.deliveryAddress.trim();
                setDeliveryAddress((prev) => prev.trim() || address);
            }
            if (deliveryType === "dine_in" && draft.tableNumber?.trim()) {
                const table = draft.tableNumber.trim();
                setTableNumber((prev) => prev.trim() || table);
            }
        } catch (err) {
            console.error("[Checkout] Failed to load draft:", err);
        } finally {
            setDraftHydrated(true);
        }
    }, [deliveryType]);

    // ── Load user data on mount ────────────────────────────────────────────
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const supabase = createClient();
                if (!supabase) return;

                // getSession() lit depuis le cache local (pas de roundtrip réseau)
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) return;
                setUserId(session.user.id);

                // Un seul appel DB pour le profil complet
                const { data: userProfile } = await supabase
                    .from("users")
                    .select("full_name, phone")
                    .eq("id", session.user.id)
                    .maybeSingle();

                if (userProfile) {
                    if (userProfile.full_name) {
                        setCustomerName((prev) => prev.trim() || userProfile.full_name);
                    }
                    if (userProfile.phone) {
                        setCustomerPhone((prev) => prev.trim() || userProfile.phone);
                    }
                }

                if (deliveryType === "delivery") {
                    const { data: addressRows, error: addressesError } = await supabase
                        .from("addresses")
                        .select("address, city, instructions, is_default")
                        .eq("user_id", session.user.id)
                        .order("is_default", { ascending: false })
                        .limit(5);

                    if (addressesError) {
                        console.error("[Checkout] Failed to load addresses:", addressesError);
                    } else if (addressRows && addressRows.length > 0) {
                        const preferredAddress = addressRows.find((addr) => addr.is_default) ?? addressRows[0];
                        const formattedAddress = formatAddressRow(preferredAddress);
                        if (formattedAddress) {
                            setDeliveryAddress((prev) => prev.trim() || formattedAddress);
                        }
                    }
                }
            } catch (err) {
                console.error("[Checkout] Failed to load user data:", err);
            }
        };

        loadUserData();
    }, [deliveryType]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!draftHydrated) return;
        const draft: CheckoutDraft = {
            customerName: customerName.trim() || undefined,
            customerPhone: customerPhone.trim() || undefined,
            deliveryAddress: deliveryAddress.trim() || undefined,
            tableNumber: tableNumber.trim() || undefined,
        };
        if (!draft.customerName && !draft.customerPhone && !draft.deliveryAddress && !draft.tableNumber) {
            window.localStorage.removeItem(CHECKOUT_DRAFT_KEY);
            return;
        }
        window.localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
    }, [customerName, customerPhone, deliveryAddress, tableNumber, draftHydrated]);

    useEffect(() => {
        if (paymentMethod !== "gift_card") {
            setGiftCardValidation(null);
        }
    }, [paymentMethod]);

    // ── Geolocation handler ────────────────────────────────────────────────
    const handleUseCurrentLocation = async () => {
        setIsLocating(true);
        setError(null);

        try {
            if (!navigator.geolocation) {
                setError("La géolocalisation n'est pas disponible sur cet appareil.");
                setIsLocating(false);
                return;
            }

            // Check and request permission explicitly
            if (navigator.permissions) {
                try {
                    const permissionStatus = await navigator.permissions.query({ name: "geolocation" });

                    if (permissionStatus.state === "denied") {
                        setError("Permission GPS refusée. Veuillez activer la géolocalisation dans les paramètres de votre navigateur.");
                        setIsLocating(false);
                        return;
                    }

                    if (permissionStatus.state === "prompt") {
                        // Permission not yet requested - will be requested by getCurrentPosition
                        console.log("Permission will be requested by browser");
                    }
                } catch {
                    console.log("Permissions API not available, will request on getPosition");
                }
            }

            // Get the position
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    // Format as readable coordinates
                    const address = `📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                    setDeliveryAddress(address);
                    setError(null);
                    setIsLocating(false);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            setError("Permission refusée. Veuillez autoriser la géolocalisation dans les paramètres de votre navigateur.");
                            break;
                        case error.POSITION_UNAVAILABLE:
                            setError("Position indisponible. Vérifiez que le GPS est activé sur votre appareil.");
                            break;
                        case error.TIMEOUT:
                            setError("Délai d'attente dépassé. Vérifiez votre connexion et réessayez.");
                            break;
                        default:
                            setError("Impossible de récupérer votre position. Réessayez.");
                    }
                    setIsLocating(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } catch (err) {
            console.error("Geolocation handler error:", err);
            setError("Erreur lors de la géolocalisation.");
            setIsLocating(false);
        }
    };

    // ── Empty cart guard ───────────────────────────────────────────────────
    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-white dark:bg-surface-950 flex flex-col items-center justify-center px-4 gap-4">
                <ShoppingBag size={56} className="text-surface-200 dark:text-surface-700" />
                <p className="text-xl font-bold text-surface-900 dark:text-white">Panier vide</p>
                <p className="text-surface-500 dark:text-surface-400 text-sm">Ajoutez des articles avant de passer commande.</p>
                <Link href="/stores" className="mt-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-2xl transition-colors">
                    Découvrir les restaurants
                </Link>
            </div>
        );
    }

    // ── Step 1 validation ──────────────────────────────────────────────────
    const validateStep1 = () => {
        if (!customerName.trim()) { setError("Votre nom est requis."); return false; }
        if (!customerPhone.trim()) { setError("Votre téléphone est requis."); return false; }
        if (deliveryType === "delivery" && !deliveryAddress.trim()) {
            setError("L'adresse de livraison est requise.");
            return false;
        }
        if (isScheduled) {
            if (!scheduledDate || !scheduledTime) {
                setError("Veuillez choisir une date et une heure pour la commande programmée.");
                return false;
            }
            const dt = new Date(`${scheduledDate}T${scheduledTime}`);
            if (isNaN(dt.getTime()) || dt < new Date(Date.now() + 30 * 60 * 1000)) {
                setError("L'heure programmée doit être au minimum 30 minutes dans le futur.");
                return false;
            }
        }
        setError(null);
        return true;
    };

    // ── Scheduled helpers ──────────────────────────────────────────────────
    // min date = today, min time = now + 30min (pour le même jour)
    const todayStr = new Date().toISOString().split("T")[0];
    const scheduledIso = isScheduled && scheduledDate && scheduledTime
        ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
        : undefined;

    // ── Split payment helpers ────────────────────────────────────────────
    const buildEqualSplits = (count: number) => {
        const base = Math.floor(total / count);
        const remainder = total - base * count;
        return Array.from({ length: count }, (_, i) => ({
            label: `Personne ${i + 1}`,
            amount: String(base + (i === 0 ? remainder : 0)),
            method: "cash" as PaymentMethod,
        }));
    };

    const toggleSplitPayment = (enabled: boolean) => {
        setIsSplitPayment(enabled);
        if (enabled) {
            setSplitDrafts(buildEqualSplits(splitCount));
        } else {
            setSplitDrafts([]);
        }
    };

    const updateSplitCount = (count: number) => {
        setSplitCount(count);
        setSplitDrafts(buildEqualSplits(count));
    };

    const updateSplitDraft = (idx: number, field: "label" | "amount" | "method", value: string) => {
        setSplitDrafts((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d)));
    };

    const splitDraftTotal = splitDrafts.reduce((sum, d) => sum + (parseInt(d.amount) || 0), 0);
    const isSplitValid = isSplitPayment ? (splitDraftTotal === total && splitDrafts.every((d) => parseInt(d.amount) > 0)) : true;
    const isGiftCardReady = paymentMethod !== "gift_card" || Boolean(giftCardValidation);
    const canContinueFromPayment = isSplitPayment ? isSplitValid : isGiftCardReady;

    const validateGiftCard = async () => {
        if (!restaurant?.id) {
            setError("Restaurant introuvable.");
            return;
        }
        const code = giftCardCode.trim().toUpperCase();
        if (!code) {
            setError("Veuillez saisir un code de carte cadeau.");
            return;
        }

        setError(null);
        setValidatingGiftCard(true);
        try {
            const res = await fetch("/api/gift-cards/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    restaurant_id: restaurant.id,
                    order_total: total,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.valid) {
                setGiftCardValidation(null);
                setError(data.error ?? "Carte cadeau invalide.");
                return;
            }
            setGiftCardValidation({
                gift_card_id: data.gift_card_id,
                code: data.code ?? code,
                current_balance: data.current_balance ?? 0,
                amount_applicable: data.amount_applicable ?? 0,
                remaining_to_pay: data.remaining_to_pay ?? 0,
            });
        } catch {
            setGiftCardValidation(null);
            setError("Erreur réseau pendant la validation de la carte cadeau.");
        } finally {
            setValidatingGiftCard(false);
        }
    };

    // ── Submit order ───────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!restaurant) { setError("Restaurant introuvable."); return; }
        if (!isSplitPayment && paymentMethod === "gift_card" && !giftCardValidation) {
            setError("Validez la carte cadeau avant de confirmer la commande.");
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            const body = {
                restaurantId:    restaurant.id,
                items:           items.map((i) => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity })),
                deliveryType,
                deliveryAddress: deliveryType === "delivery" ? deliveryAddress.trim() : undefined,
                tableNumber:     deliveryType === "dine_in"  ? tableNumber.trim() : undefined,
                customerName:    customerName.trim(),
                customerPhone:   customerPhone.trim(),
                paymentMethod:   isSplitPayment ? "cash" : paymentMethod,
                giftCardCode:   !isSplitPayment && paymentMethod === "gift_card" ? giftCardCode.trim().toUpperCase() : undefined,
                subtotal,
                deliveryFee,
                total,
                customerId:      userId ?? undefined,
                scheduledFor:    scheduledIso,
            };
            const res = await fetch("/api/store/order", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Erreur lors de la commande.");
                return;
            }
            const orderId = data.order?.id ?? data.id ?? data.orderId;
            const confirmedScheduledFor: string | null = data.scheduledFor ?? null;
            const parsedRemaining = Number(data.remainingToPay);
            const totalDueNow = Number.isFinite(parsedRemaining) ? parsedRemaining : total;

            // Create split payments if enabled (fire-and-forget — restaurant will manage confirmation)
            if (isSplitPayment && orderId) {
                fetch(`/api/orders/${orderId}/splits`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        split_mode: "split_equal",
                        splits: splitDrafts.map((d) => ({
                            label: d.label,
                            amount: parseInt(d.amount),
                            payment_method: d.method,
                        })),
                    }),
                }).catch(() => {
                    console.warn("[Checkout] Split payment enregistrement échoué — le restaurant peut gérer manuellement.");
                });
            }
            // Persister dans le store local pour le suivi
            if (orderId && restaurant) {
                addOrder({
                    id:             orderId,
                    restaurantId:   restaurant.id,
                    restaurantName: restaurant.name,
                    restaurantSlug: restaurant.slug,
                    total:          totalDueNow,
                    itemCount:      items.reduce((n, i) => n + i.quantity, 0),
                    status:         "pending",
                    deliveryType,
                    createdAt:      new Date().toISOString(),
                });
            }
            clear();
            const confirmUrl = new URL("/stores/confirmation", window.location.origin);
            confirmUrl.searchParams.set("orderId", orderId);
            confirmUrl.searchParams.set("restaurant", restaurant.name);
            confirmUrl.searchParams.set("total", String(totalDueNow));
            if (confirmedScheduledFor) confirmUrl.searchParams.set("scheduledFor", confirmedScheduledFor);
            router.push(confirmUrl.pathname + confirmUrl.search);
        } catch {
            setError("Impossible de passer la commande. Vérifiez votre connexion.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
            {/* ── Header ───────────────────────────────────────────────── */}
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-surface-950/95 backdrop-blur-md border-b border-surface-200 dark:border-surface-800">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
                    <button
                        onClick={() => {
                            if (step === "payment") setStep("info");
                            else if (step === "review") setStep("payment");
                            else router.back();
                        }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400 transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <h1 className="font-bold text-surface-900 dark:text-white">Finaliser la commande</h1>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                <StepIndicator step={step} />

                {/* ── Error ────────────────────────────────────────────── */}
                {error && (
                    <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3 text-red-600 dark:text-red-400">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* ── Step 1 : Customer info ────────────────────────────── */}
                {step === "info" && (
                    <div className="space-y-4">
                        <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                            <h2 className="font-bold text-surface-900 dark:text-white mb-4">Vos coordonnées</h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5">
                                        Nom complet *
                                    </label>
                                    <input
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Jean-Paul Mbida"
                                        className="w-full h-11 px-4 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5">
                                        Téléphone *
                                    </label>
                                    <input
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        type="tel"
                                        placeholder="6XX XXX XXX"
                                        className="w-full h-11 px-4 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Mode-specific fields */}
                        {deliveryType === "delivery" && (
                            <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-bold text-surface-900 dark:text-white flex items-center gap-2">
                                        <MapPin size={16} className="text-brand-500" /> Adresse de livraison
                                    </h2>
                                    <button
                                        onClick={handleUseCurrentLocation}
                                        disabled={isLocating}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Utiliser votre position actuelle"
                                    >
                                        {isLocating ? (
                                            <>
                                                <Loader size={14} className="animate-spin" />
                                                Localisation...
                                            </>
                                        ) : (
                                            <>
                                                <Navigation size={14} />
                                                Utiliser ma position
                                            </>
                                        )}
                                    </button>
                                </div>
                                <textarea
                                    value={deliveryAddress}
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                    placeholder="Quartier, rue, point de repère…"
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition resize-none"
                                />
                            </section>
                        )}

                        {deliveryType === "dine_in" && (
                            <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                                <h2 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Utensils size={16} className="text-brand-500" /> Numéro de table
                                </h2>
                                <input
                                    value={tableNumber}
                                    onChange={(e) => setTableNumber(e.target.value)}
                                    placeholder="Ex: Table 5"
                                    className="w-full h-11 px-4 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition"
                                />
                            </section>
                        )}

                        {deliveryType === "pickup" && (
                            <section className="bg-brand-50 dark:bg-brand-500/10 rounded-2xl border border-brand-200 dark:border-brand-500/20 p-4 flex items-start gap-3">
                                <Package size={18} className="text-brand-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-brand-700 dark:text-brand-300">
                                    Vous récupérerez votre commande directement au restaurant.
                                </p>
                            </section>
                        )}

                        {/* ── Commande programmée ───────────────────────── */}
                        <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CalendarClock size={16} className="text-brand-500" />
                                    <h2 className="font-bold text-surface-900 dark:text-white">Programmer la commande</h2>
                                </div>
                                {/* Toggle */}
                                <button
                                    type="button"
                                    onClick={() => { setIsScheduled(!isScheduled); setScheduledDate(""); setScheduledTime(""); }}
                                    role="switch"
                                    aria-checked={isScheduled}
                                    aria-label={isScheduled ? "Désactiver la programmation de commande" : "Activer la programmation de commande"}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${isScheduled ? "bg-brand-500" : "bg-surface-200 dark:bg-surface-700"}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isScheduled ? "translate-x-5" : ""}`} />
                                </button>
                            </div>

                            {!isScheduled && (
                                <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800">
                                    <Zap size={14} className="text-amber-500 shrink-0" />
                                    <p className="text-sm text-surface-600 dark:text-surface-400">
                                        Votre commande sera préparée <span className="font-semibold text-surface-900 dark:text-white">dès que possible</span>.
                                    </p>
                                </div>
                            )}

                            {isScheduled && (
                                <div className="mt-4 space-y-3">
                                    <p className="text-xs text-surface-500 dark:text-surface-400">
                                        Choisissez la date et l&apos;heure souhaitées (minimum 30 min dans le futur).
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label htmlFor="scheduled-date" className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5">
                                                Date
                                            </label>
                                            <input
                                                id="scheduled-date"
                                                type="date"
                                                value={scheduledDate}
                                                min={todayStr}
                                                onChange={(e) => setScheduledDate(e.target.value)}
                                                aria-label="Date de livraison programmée"
                                                className="w-full h-11 px-3 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="scheduled-time" className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5">
                                                Heure
                                            </label>
                                            <input
                                                id="scheduled-time"
                                                type="time"
                                                value={scheduledTime}
                                                onChange={(e) => setScheduledTime(e.target.value)}
                                                aria-label="Heure de livraison programmée"
                                                className="w-full h-11 px-3 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition"
                                            />
                                        </div>
                                    </div>
                                    {scheduledDate && scheduledTime && (() => {
                                        const previewDate = new Date(`${scheduledDate}T${scheduledTime}`);
                                        if (isNaN(previewDate.getTime())) return null;
                                        return (
                                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20">
                                                <CalendarClock size={14} className="text-brand-500 shrink-0" />
                                                <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
                                                    Livraison prévue le{" "}
                                                    {previewDate.toLocaleString("fr-CM", {
                                                        weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
                                                    })}
                                                </p>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </section>

                        <button
                            onClick={() => { if (validateStep1()) setStep("payment"); }}
                            className="w-full h-13 py-3.5 flex items-center justify-center bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition-colors"
                        >
                            Continuer → Paiement
                        </button>
                    </div>
                )}

                {/* ── Step 2 : Payment ──────────────────────────────────── */}
                {step === "payment" && (
                    <div className="space-y-4">
                        {/* Single payment method (when not splitting) */}
                        {!isSplitPayment && (
                            <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                                <h2 className="font-bold text-surface-900 dark:text-white mb-4">Mode de paiement</h2>
                                <div className="space-y-2">
                                    {PAYMENT_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setPaymentMethod(opt.id)}
                                            className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                                                paymentMethod === opt.id
                                                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                                                    : "border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600"
                                            }`}
                                        >
                                            <span className={paymentMethod === opt.id ? "text-brand-500" : "text-surface-400"}>
                                                {opt.icon}
                                            </span>
                                            <div className="flex-1">
                                                <p className={`font-semibold text-sm ${paymentMethod === opt.id ? "text-brand-700 dark:text-brand-300" : "text-surface-900 dark:text-white"}`}>
                                                    {opt.label}
                                                </p>
                                                <p className="text-xs text-surface-500 dark:text-surface-400">{opt.desc}</p>
                                            </div>
                                            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                                paymentMethod === opt.id ? "border-brand-500" : "border-surface-300 dark:border-surface-600"
                                            }`}>
                                                {paymentMethod === opt.id && (
                                                    <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                                                )}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {paymentMethod === "gift_card" && (
                                    <div className="mt-4 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-500/10 p-4 space-y-3">
                                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                            Saisissez votre code de carte cadeau
                                        </p>
                                        <div className="flex gap-2">
                                            <input
                                                value={giftCardCode}
                                                onChange={(e) => {
                                                    setGiftCardCode(e.target.value.toUpperCase());
                                                    setGiftCardValidation(null);
                                                }}
                                                placeholder="Ex: GC-ABCD-EFGH"
                                                className="flex-1 h-11 px-3 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                                            />
                                            <button
                                                type="button"
                                                onClick={validateGiftCard}
                                                disabled={validatingGiftCard || !giftCardCode.trim()}
                                                className="px-4 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                                            >
                                                {validatingGiftCard ? "Validation..." : "Valider"}
                                            </button>
                                        </div>
                                        {giftCardValidation && (
                                            <div className="text-xs space-y-1 text-emerald-700 dark:text-emerald-300">
                                                <p>Solde: <span className="font-semibold">{formatCFA(giftCardValidation.current_balance)}</span></p>
                                                <p>Appliqué à cette commande: <span className="font-semibold">{formatCFA(giftCardValidation.amount_applicable)}</span></p>
                                                <p>Reste à payer: <span className="font-semibold">{formatCFA(giftCardValidation.remaining_to_pay)}</span></p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Split payment UI */}
                        {isSplitPayment && (
                            <section className="bg-white dark:bg-surface-900 rounded-2xl border border-brand-200 dark:border-brand-500/20 p-5">
                                <h2 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Users size={16} className="text-brand-500" />
                                    Partager l&apos;addition
                                </h2>

                                {/* Person count */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-surface-600 dark:text-surface-400">Nombre de personnes</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateSplitCount(Math.max(2, splitCount - 1))}
                                            className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 font-bold hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                                        >
                                            -
                                        </button>
                                        <span className="w-8 text-center font-bold text-surface-900 dark:text-white">{splitCount}</span>
                                        <button
                                            onClick={() => updateSplitCount(Math.min(8, splitCount + 1))}
                                            className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 font-bold hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Split rows */}
                                <div className="space-y-2">
                                    {splitDrafts.map((draft, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
                                            <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs font-bold shrink-0">
                                                {idx + 1}
                                            </div>
                                            <input
                                                value={draft.label}
                                                onChange={(e) => updateSplitDraft(idx, "label", e.target.value)}
                                                className="flex-1 h-8 px-2 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                                            />
                                            <span className="font-mono font-bold text-sm text-surface-900 dark:text-white whitespace-nowrap">
                                                {formatCFA(parseInt(draft.amount) || 0)}
                                            </span>
                                            <select
                                                value={draft.method}
                                                onChange={(e) => updateSplitDraft(idx, "method", e.target.value)}
                                                className="h-8 px-2 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                                            >
                                                {SPLIT_PAYMENT_OPTIONS.map((pm) => (
                                                    <option key={pm.id} value={pm.id}>{pm.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>

                                {/* Total indicator */}
                                <div className={`mt-3 flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold ${
                                    splitDraftTotal === total
                                        ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                                        : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                }`}>
                                    <span>Total</span>
                                    <span>{formatCFA(splitDraftTotal)} / {formatCFA(total)}</span>
                                </div>
                            </section>
                        )}

                        {/* Toggle split payment */}
                        {deliveryType === "dine_in" && (
                            <button
                                onClick={() => toggleSplitPayment(!isSplitPayment)}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                                    isSplitPayment
                                        ? "border-surface-300 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-400"
                                        : "border-brand-200 dark:border-brand-500/30 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-500/5 hover:bg-brand-50 dark:hover:bg-brand-500/10"
                                }`}
                            >
                                <Users size={16} />
                                {isSplitPayment ? "Revenir au paiement unique" : "Partager l\u2019addition entre plusieurs personnes"}
                            </button>
                        )}

                        <button
                            onClick={() => {
                                if (canContinueFromPayment) {
                                    setStep("review");
                                } else if (!isSplitValid) {
                                    setError("Le total des parts doit correspondre au total de la commande.");
                                } else {
                                    setError("Validez d'abord votre carte cadeau.");
                                }
                            }}
                            disabled={!canContinueFromPayment}
                            className="w-full h-13 py-3.5 flex items-center justify-center bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition-colors"
                        >
                            Continuer &rarr; R&eacute;capitulatif
                        </button>
                    </div>
                )}

                {/* ── Step 3 : Review & confirm ─────────────────────────── */}
                {step === "review" && (
                    <div className="space-y-4">
                        {/* Restaurant */}
                        <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <ChefHat size={20} className="text-brand-500" />
                                <div>
                                    <p className="font-bold text-surface-900 dark:text-white">{restaurant?.name}</p>
                                    <p className="text-xs text-surface-500 dark:text-surface-400">{DELIVERY_LABELS[deliveryType]}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span className="text-surface-700 dark:text-surface-300">
                                            {item.quantity}× {item.name}
                                        </span>
                                        <span className="font-medium text-surface-900 dark:text-white">{formatCFA(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Order details */}
                        <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 space-y-3">
                            <h2 className="font-bold text-surface-900 dark:text-white mb-1">Détails de la commande</h2>
                            <Detail label="Nom" value={customerName} />
                            <Detail label="Téléphone" value={customerPhone} />
                            {deliveryType === "delivery" && <Detail label="Adresse" value={deliveryAddress} />}
                            {deliveryType === "dine_in" && tableNumber && <Detail label="Table" value={tableNumber} />}
                            <Detail
                                label="Paiement"
                                value={isSplitPayment
                                    ? `Partage (${splitDrafts.length} personnes)`
                                    : paymentMethod === "gift_card" && giftCardValidation
                                    ? giftCardValidation.remaining_to_pay > 0
                                        ? `Carte cadeau + solde (${formatCFA(giftCardValidation.remaining_to_pay)})`
                                        : "Carte cadeau (totalement couvert)"
                                    : PAYMENT_OPTIONS.find((p) => p.id === paymentMethod)?.label ?? paymentMethod
                                }
                            />
                        </section>

                        {/* Split payment summary */}
                        {isSplitPayment && splitDrafts.length > 0 && (
                            <section className="bg-white dark:bg-surface-900 rounded-2xl border border-brand-200 dark:border-brand-500/20 p-5">
                                <h2 className="font-bold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Users size={16} className="text-brand-500" />
                                    R&eacute;partition du paiement
                                </h2>
                                <div className="space-y-2">
                                    {splitDrafts.map((draft, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <span className="text-surface-600 dark:text-surface-400">
                                                {draft.label} &middot; {PAYMENT_OPTIONS.find((p) => p.id === draft.method)?.label}
                                            </span>
                                            <span className="font-semibold text-surface-900 dark:text-white">
                                                {formatCFA(parseInt(draft.amount) || 0)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Totals */}
                        <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                            <h2 className="font-bold text-surface-900 dark:text-white mb-3">Récapitulatif</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-surface-600 dark:text-surface-400">
                                    <span>Sous-total</span>
                                    <span className="font-medium text-surface-900 dark:text-white">{formatCFA(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-surface-600 dark:text-surface-400">
                                    <span>Frais de livraison</span>
                                    <span className="font-medium text-surface-900 dark:text-white">{deliveryFee === 0 ? "Gratuit" : formatCFA(deliveryFee)}</span>
                                </div>
                                <div className="flex justify-between text-surface-600 dark:text-surface-400">
                                    <span>Frais de service</span>
                                    <span className="font-medium text-surface-900 dark:text-white">{formatCFA(SERVICE_FEE)}</span>
                                </div>
                                {paymentMethod === "gift_card" && giftCardValidation && (
                                    <>
                                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                            <span>Carte cadeau appliquée</span>
                                            <span className="font-medium">- {formatCFA(giftCardValidation.amount_applicable)}</span>
                                        </div>
                                        <div className="flex justify-between text-surface-600 dark:text-surface-400">
                                            <span>Reste à payer</span>
                                            <span className="font-medium text-surface-900 dark:text-white">{formatCFA(giftCardValidation.remaining_to_pay)}</span>
                                        </div>
                                    </>
                                )}
                                <div className="pt-3 border-t border-surface-100 dark:border-surface-800 flex justify-between">
                                    <span className="font-bold text-surface-900 dark:text-white text-base">Total</span>
                                    <span className="font-extrabold text-surface-900 dark:text-white text-base">{formatCFA(total)}</span>
                                </div>
                            </div>
                        </section>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full h-14 flex items-center justify-center gap-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-bold text-base rounded-2xl shadow-lg shadow-brand-500/25 transition-colors"
                        >
                            {submitting ? (
                                <><Loader2 size={18} className="animate-spin" /> Envoi en cours…</>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    {paymentMethod === "gift_card" && giftCardValidation
                                        ? `Confirmer • Reste à payer ${formatCFA(giftCardValidation.remaining_to_pay)}`
                                        : `Confirmer la commande • ${formatCFA(total)}`}
                                </>
                            )}
                        </button>

                        <p className="text-xs text-center text-surface-400 dark:text-surface-500">
                            En confirmant, vous acceptez les{" "}
                            <Link href="/terms" className="underline">Conditions d&apos;utilisation</Link>.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between text-sm gap-4">
            <span className="text-surface-500 dark:text-surface-400 shrink-0">{label}</span>
            <span className="font-medium text-surface-900 dark:text-white text-right">{value}</span>
        </div>
    );
}
