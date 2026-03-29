"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MapPin, WifiOff, Wifi, ShieldCheck } from "lucide-react";
import dynamic from "next/dynamic";
import type { MapPosition } from "../delivery/DeliveryMap";

const DeliveryMap = dynamic(
    () => import("../delivery/DeliveryMap").then((m) => m.DeliveryMap),
    { ssr: false, loading: () => <div className="h-48 w-full rounded-xl bg-surface-100 dark:bg-surface-800 animate-pulse" /> }
);

interface TrackingSession {
    order_id: string;
    client_lat: number | null;
    client_lng: number | null;
    client_address: string | null;
    deliverer_lat: number | null;
    deliverer_lng: number | null;
    deliverer_name: string | null;
    status: "pending" | "active" | "completed";
    started_at: string | null;
    updated_at: string;
}

interface DriverDeliveryTrackerProps {
    orderId: string;
    deliveryAddress: string | null;
    customerName?: string;
    customerPhone?: string;
}

const GPS_INTERVAL_MS = 5_000;

export function DriverDeliveryTracker({ orderId, deliveryAddress, customerName, customerPhone }: DriverDeliveryTrackerProps) {
    const [session, setSession] = useState<TrackingSession | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [gpsError, setGpsError] = useState<string | null>(null);
    const [gpsConsentGiven, setGpsConsentGiven] = useState(false);
    const gpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const sessionStartedRef = useRef(false);

    // Start tracking session on the server
    const startSession = useCallback(async () => {
        try {
            const res = await fetch(`/api/driver/tracking/${orderId}`, { method: "PUT" });
            if (res.ok) {
                const data = await res.json();
                setSession(data.tracking);
            }
        } catch {
            // Silent — will retry
        }
    }, [orderId]);

    // Push GPS position to server
    const pushPosition = useCallback(async (lat: number, lng: number) => {
        try {
            await fetch(`/api/driver/tracking/${orderId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lat, lng }),
            });
        } catch {
            // Silent retry on next interval
        }
    }, [orderId]);

    // Auto-start GPS on mount — only after explicit consent
    useEffect(() => {
        if (!gpsConsentGiven) return;

        if (!navigator.geolocation) {
            setGpsError("Géolocalisation non disponible sur cet appareil");
            return;
        }

        const init = async () => {
            // Load or create session
            try {
                const res = await fetch(`/api/driver/tracking/${orderId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.tracking) {
                        setSession(data.tracking);
                    } else if (!sessionStartedRef.current) {
                        sessionStartedRef.current = true;
                        await startSession();
                    }
                } else if (!sessionStartedRef.current) {
                    sessionStartedRef.current = true;
                    await startSession();
                }
            } catch {
                if (!sessionStartedRef.current) {
                    sessionStartedRef.current = true;
                    await startSession();
                }
            }

            // Start broadcasting position immediately
            const send = () => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => pushPosition(pos.coords.latitude, pos.coords.longitude),
                    () => setGpsError("Impossible d'accéder au GPS"),
                    { enableHighAccuracy: true, timeout: 8000 }
                );
            };

            send();
            gpsIntervalRef.current = setInterval(send, GPS_INTERVAL_MS);
        };

        init();

        return () => {
            if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
        };
    }, [orderId, startSession, pushPosition, gpsConsentGiven]);

    // Supabase Realtime — sync position updates
    useEffect(() => {
        const supabase = createClient();
        if (!supabase) return;

        const channel = supabase
            .channel(`delivery_tracking:${orderId}`)
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "delivery_tracking", filter: `order_id=eq.${orderId}` },
                (payload) => setSession(payload.new as TrackingSession)
            )
            .subscribe((status) => setIsConnected(status === "SUBSCRIBED"));

        return () => { supabase.removeChannel(channel); };
    }, [orderId]);

    const clientPos: MapPosition | null = session?.client_lat && session.client_lng
        ? { lat: Number(session.client_lat), lng: Number(session.client_lng), label: session.client_address ?? "Client", name: customerName, phone: customerPhone }
        : null;

    const delivererPos: MapPosition | null = session?.deliverer_lat && session.deliverer_lng
        ? { lat: Number(session.deliverer_lat), lng: Number(session.deliverer_lng), label: session.deliverer_name ?? "Ma position" }
        : null;

    return (
        <div className="space-y-2 mt-3 border-t border-surface-100 dark:border-surface-800 pt-3">
            {/* Consent banner — shown once before GPS activates (Loi n°2010/012 Art.29) */}
            {!gpsConsentGiven && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 p-3 space-y-2">
                    <div className="flex items-start gap-2">
                        <ShieldCheck size={15} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                                Partage de position GPS
                            </p>
                            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                                Votre position sera transmise toutes les 5 secondes pendant la livraison afin
                                de permettre au client de suivre son colis en temps réel. Ces données sont
                                supprimées à la fin de la session de livraison.{" "}
                                <span className="font-medium">Base légale : Loi n°2010/012 Art.29</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setGpsConsentGiven(true)}
                            className="flex-1 h-8 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                        >
                            Autoriser le partage GPS
                        </button>
                        <button
                            onClick={() => setGpsError("Partage GPS refusé — le suivi n'est pas disponible.")}
                            className="px-3 h-8 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800/30 rounded-lg transition-colors"
                        >
                            Refuser
                        </button>
                    </div>
                </div>
            )}
            {/* Status bar */}
            {gpsConsentGiven && (
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs">
                    {isConnected ? (
                        <Wifi size={13} className="text-green-500" />
                    ) : (
                        <WifiOff size={13} className="text-surface-400" />
                    )}
                    <span className={isConnected ? "text-green-600 dark:text-green-400 font-medium" : "text-surface-500"}>
                        {isConnected ? "GPS actif · Temps réel" : "Connexion..."}
                    </span>
                </div>
                {deliveryAddress && (
                    <span className="text-[11px] text-surface-400 truncate max-w-[180px]">
                        {deliveryAddress}
                    </span>
                )}
            </div>
            )}

            {/* Map */}
            {gpsConsentGiven && (clientPos || delivererPos) ? (
                <DeliveryMap
                    clientPosition={clientPos}
                    delivererPosition={delivererPos}
                    className="h-48 w-full rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700"
                    showRoute={true}
                />
            ) : gpsConsentGiven ? (
                <div className="h-32 w-full rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex flex-col items-center justify-center gap-2">
                    <MapPin size={24} className="text-surface-300 dark:text-surface-600" />
                    <p className="text-xs text-surface-500 text-center">Localisation en cours…</p>
                </div>
            ) : null}

            {gpsError && <p className="text-xs text-red-500 text-center">{gpsError}</p>}
        </div>
    );
}
