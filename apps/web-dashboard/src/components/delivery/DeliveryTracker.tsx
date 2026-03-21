"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { authFetch } from "@kbouffe/module-core/ui";
import { MapPin, Navigation, Loader2, WifiOff, Wifi } from "lucide-react";
import dynamic from "next/dynamic";
import type { MapPosition } from "./DeliveryMap";

const DeliveryMap = dynamic(
  () => import("./DeliveryMap").then((m) => m.DeliveryMap),
  { ssr: false, loading: () => <div className="h-64 w-full rounded-xl bg-surface-100 dark:bg-surface-800 animate-pulse" /> }
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

interface DeliveryTrackerProps {
  /** Order ID — the merchant tracks this order */
  orderId: string;
  /** Deliverer's name to display */
  delivererName?: string;
  /** True = merchant view (shares GPS). False = client view (watches in real-time) */
  isDeliverer?: boolean;
  /** Client address pre-loaded from order */
  clientAddress?: string;
  /** Called when session is loaded */
  onSessionLoaded?: (session: TrackingSession) => void;
}

const GPS_INTERVAL_MS = 5_000; // Push position every 5 seconds

export function DeliveryTracker({
  orderId,
  delivererName = "Livreur",
  isDeliverer = false,
  onSessionLoaded,
}: DeliveryTrackerProps) {
  const [session, setSession] = useState<TrackingSession | null>(null);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const gpsWatchRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<any>(null);

  // Load current session state
  const loadSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/delivery/tracking/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setSession(data.tracking);
        onSessionLoaded?.(data.tracking);
      }
    } catch {
      // Session not found yet — normal before delivery starts
    }
  }, [orderId, onSessionLoaded]);

  useEffect(() => { loadSession(); }, [loadSession]);

  // Supabase Realtime — subscribe to position changes
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`delivery_tracking:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "delivery_tracking",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const updated = payload.new as TrackingSession;
          setSession(updated);
          setLastUpdate(new Date());
          onSessionLoaded?.(updated);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [orderId, onSessionLoaded]);

  // Start tracking session (deliverer only)
  const startSession = useCallback(async () => {
    try {
      const res = await authFetch(`/api/delivery/tracking/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliverer_name: delivererName }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.tracking);
      }
    } catch (err) {
      setError("Impossible de démarrer la session");
    }
  }, [orderId, delivererName]);

  // Push GPS position to Supabase
  const pushPosition = useCallback(async (lat: number, lng: number) => {
    try {
      await authFetch(`/api/delivery/tracking/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, deliverer_name: delivererName }),
      });
      setLastUpdate(new Date());
    } catch {
      // Silent — will retry in next interval
    }
  }, [orderId, delivererName]);

  // Start/stop GPS broadcasting (deliverer only)
  const toggleGps = useCallback(async () => {
    if (isGpsActive) {
      if (gpsWatchRef.current) clearInterval(gpsWatchRef.current);
      setIsGpsActive(false);
      return;
    }

    if (!navigator.geolocation) {
      setError("Géolocalisation non disponible sur cet appareil");
      return;
    }

    // Start session if not already active
    if (!session || session.status !== "active") {
      await startSession();
    }

    setIsGpsActive(true);

    // Push immediately, then every GPS_INTERVAL_MS
    const sendPosition = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          pushPosition(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn("GPS error:", err.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    };

    sendPosition();
    gpsWatchRef.current = setInterval(sendPosition, GPS_INTERVAL_MS);
  }, [isGpsActive, session, startSession, pushPosition]);

  useEffect(() => {
    return () => {
      if (gpsWatchRef.current) clearInterval(gpsWatchRef.current);
    };
  }, []);

  const clientPos: MapPosition | null = session?.client_lat && session.client_lng
    ? { lat: session.client_lat, lng: session.client_lng, label: session.client_address ?? "Client" }
    : null;

  const delivererPos: MapPosition | null = session?.deliverer_lat && session.deliverer_lng
    ? { lat: session.deliverer_lat, lng: session.deliverer_lng, label: session.deliverer_name ?? "Livreur" }
    : null;

  const hasPositions = clientPos || delivererPos;

  return (
    <div className="space-y-3">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {isConnected ? (
            <Wifi size={15} className="text-green-500" />
          ) : (
            <WifiOff size={15} className="text-surface-400" />
          )}
          <span className={isConnected ? "text-green-600 dark:text-green-400 font-medium" : "text-surface-500"}>
            {isConnected ? "Temps réel actif" : "Connexion..."}
          </span>
        </div>
        {lastUpdate && (
          <span className="text-xs text-surface-400">
            Mis à jour {lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        )}
      </div>

      {/* Map */}
      {hasPositions ? (
        <DeliveryMap
          clientPosition={clientPos}
          delivererPosition={delivererPos}
          className="h-64 w-full rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700 shadow-sm"
          showRoute={true}
        />
      ) : (
        <div className="h-64 w-full rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex flex-col items-center justify-center gap-3">
          <MapPin size={32} className="text-surface-300 dark:text-surface-600" />
          <p className="text-sm text-surface-500 dark:text-surface-400 text-center">
            {isDeliverer
              ? "Activez le GPS pour partager votre position"
              : "En attente de la position du livreur..."}
          </p>
        </div>
      )}

      {/* Deliverer controls */}
      {isDeliverer && (
        <div className="flex items-center gap-3">
          <button
            onClick={toggleGps}
            className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold transition-all ${
              isGpsActive
                ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                : "bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20"
            }`}
          >
            {isGpsActive ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Partage GPS actif — Arrêter
              </>
            ) : (
              <>
                <Navigation size={15} />
                Démarrer le partage GPS
              </>
            )}
          </button>
        </div>
      )}

      {/* Client position info */}
      {session?.client_address && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <MapPin size={15} className="text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Adresse client</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">{session.client_address}</p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
