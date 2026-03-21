"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Bike, Clock, CheckCircle2 } from "lucide-react";
import dynamic from "next/dynamic";
import type { MapPosition } from "@/components/delivery/DeliveryMap";

const DeliveryMap = dynamic(
  () => import("@/components/delivery/DeliveryMap").then((m) => m.DeliveryMap),
  { ssr: false, loading: () => <div className="h-56 w-full rounded-xl bg-surface-100 animate-pulse" /> }
);

interface TrackingData {
  client_lat: number | null;
  client_lng: number | null;
  client_address: string | null;
  deliverer_lat: number | null;
  deliverer_lng: number | null;
  deliverer_name: string | null;
  status: "pending" | "active" | "completed";
  updated_at: string;
}

interface OrderTrackingMapProps {
  orderId: string;
  orderStatus: string;
}

export function OrderTrackingMap({ orderId, orderStatus }: OrderTrackingMapProps) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [isLive, setIsLive] = useState(false);

  const loadTracking = useCallback(async () => {
    try {
      const res = await fetch(`/api/delivery/tracking/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setTracking(data.tracking);
      }
    } catch {
      // Not yet in delivery
    }
  }, [orderId]);

  useEffect(() => { loadTracking(); }, [loadTracking]);

  // Subscribe to real-time position updates
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`order_tracking_client:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "delivery_tracking",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          setTracking(payload.new as TrackingData);
          setIsLive(true);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  // Only show for orders in delivery
  if (!["out_for_delivery", "delivering"].includes(orderStatus) && !tracking) {
    return null;
  }

  const delivererPos: MapPosition | null = tracking?.deliverer_lat && tracking.deliverer_lng
    ? { lat: tracking.deliverer_lat, lng: tracking.deliverer_lng, label: tracking.deliverer_name ?? "Livreur" }
    : null;

  const clientPos: MapPosition | null = tracking?.client_lat && tracking.client_lng
    ? { lat: tracking.client_lat, lng: tracking.client_lng, label: "Votre adresse" }
    : null;

  return (
    <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-200 dark:border-surface-800">
        <div className="w-10 h-10 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500">
          <Bike size={22} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-surface-900 dark:text-white text-sm">
            {tracking?.status === "completed" ? "Livraison terminée" : "Votre livreur est en route"}
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 flex items-center gap-1">
            {isLive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Position en temps réel
              </>
            ) : (
              <>
                <Clock size={11} />
                Chargement de la position...
              </>
            )}
          </p>
        </div>
      </div>

      {/* Map */}
      <div className="p-3">
        {delivererPos || clientPos ? (
          <DeliveryMap
            clientPosition={clientPos}
            delivererPosition={delivererPos}
            className="h-56 w-full rounded-xl overflow-hidden"
            showRoute={!!(delivererPos && clientPos)}
          />
        ) : (
          <div className="h-56 flex flex-col items-center justify-center gap-3 bg-surface-100 dark:bg-surface-800 rounded-xl">
            <Bike size={28} className="text-surface-300 dark:text-surface-600" />
            <p className="text-sm text-surface-500 dark:text-surface-400">
              En attente de la position du livreur...
            </p>
          </div>
        )}
      </div>

      {/* Client address */}
      {tracking?.client_address && (
        <div className="flex items-start gap-2 px-5 pb-4">
          <MapPin size={14} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-surface-600 dark:text-surface-400">
            <span className="font-semibold">Livraison à :</span> {tracking.client_address}
          </p>
        </div>
      )}

      {/* Completed state */}
      {tracking?.status === "completed" && (
        <div className="flex items-center gap-2 px-5 pb-4 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={16} />
          <p className="text-sm font-bold">Livraison confirmée</p>
        </div>
      )}
    </div>
  );
}
