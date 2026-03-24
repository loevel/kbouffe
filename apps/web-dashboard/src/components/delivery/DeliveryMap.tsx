"use client";

import { useEffect, useRef, useState } from "react";

export interface MapPosition {
  lat: number;
  lng: number;
  label?: string;
  name?: string;
  phone?: string;
}

export interface DeliveryMapProps {
  clientPosition?: MapPosition | null;
  delivererPosition?: MapPosition | null;
  className?: string;
  showRoute?: boolean;
}

/**
 * DeliveryMap — Leaflet + OpenStreetMap, 100% free.
 * Marqueurs clairs avec labels permanents + légende intégrée.
 */
export function DeliveryMap({
  clientPosition,
  delivererPosition,
  className = "h-64 w-full rounded-xl overflow-hidden",
  showRoute = true,
}: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const clientMarkerRef = useRef<any>(null);
  const delivererMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  // ── Icône client : pin bleu avec maison ──────────────────────────────────
  function getClientIcon(L: any) {
    const html = `
      <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35))">
        <div style="
          background:#2563eb;
          border:3px solid white;
          width:42px;height:42px;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          display:flex;align-items:center;justify-content:center;
        ">
          <svg style="transform:rotate(45deg)" width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </div>
        <div style="
          margin-top:2px;
          background:#2563eb;
          color:white;
          font-size:10px;
          font-weight:700;
          padding:2px 8px;
          border-radius:99px;
          white-space:nowrap;
          border:2px solid white;
          letter-spacing:0.3px;
        ">CLIENT</div>
      </div>`;
    return L.divIcon({
      className: "",
      html,
      iconSize: [42, 62],
      iconAnchor: [21, 62],
      popupAnchor: [0, -65],
    });
  }

  // ── Icône livreur : pin orange animé avec scooter ────────────────────────
  function getDelivererIcon(L: any) {
    const html = `
      <style>
        @keyframes deliverer-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(234,88,12,0.5); }
          50%      { box-shadow: 0 0 0 10px rgba(234,88,12,0); }
        }
      </style>
      <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35))">
        <div style="
          background:#ea580c;
          border:3px solid white;
          width:46px;height:46px;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          display:flex;align-items:center;justify-content:center;
          animation:deliverer-pulse 1.8s infinite;
        ">
          <svg style="transform:rotate(45deg)" width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M19 7c0-1.1-.9-2-2-2h-3L12 3H7L5 5H3c-1.1 0-2 .9-2 2v1h18V7zM3 10l1.5 9h15L21 10H3z"/>
            <circle cx="6.5" cy="20.5" r="2.5" fill="white"/>
            <circle cx="17.5" cy="20.5" r="2.5" fill="white"/>
          </svg>
        </div>
        <div style="
          margin-top:2px;
          background:#ea580c;
          color:white;
          font-size:10px;
          font-weight:700;
          padding:2px 8px;
          border-radius:99px;
          white-space:nowrap;
          border:2px solid white;
          letter-spacing:0.3px;
        ">LIVREUR</div>
      </div>`;
    return L.divIcon({
      className: "",
      html,
      iconSize: [46, 68],
      iconAnchor: [23, 68],
      popupAnchor: [0, -70],
    });
  }

  // ── Init Leaflet ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    // Guard against re-init on a container Leaflet already touched (React reuses the DOM node)
    const container = mapRef.current;
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
      container.innerHTML = "";
    }

    async function initMap() {
      const L = (await import("leaflet")).default;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      leafletRef.current = L;

      const defaultCenter = clientPosition ?? delivererPosition ?? { lat: 4.061, lng: 9.769 };

      const map = L.map(mapRef.current!, {
        center: [defaultCenter.lat, defaultCenter.lng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // ── Légende intégrée ──────────────────────────────────────────────
      const legend = new (L.Control as any)({ position: "bottomleft" });
      legend.onAdd = () => {
        const div = L.DomUtil.create("div");
        div.innerHTML = `
          <div style="
            background:white;
            border-radius:10px;
            padding:8px 12px;
            font-size:12px;
            font-family:sans-serif;
            box-shadow:0 2px 8px rgba(0,0,0,0.18);
            display:flex;
            flex-direction:column;
            gap:5px;
          ">
            <div style="display:flex;align-items:center;gap:7px">
              <div style="width:14px;height:14px;background:#2563eb;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(37,99,235,0.5);flex-shrink:0"></div>
              <span style="font-weight:600;color:#1e293b">Client (destination)</span>
            </div>
            <div style="display:flex;align-items:center;gap:7px">
              <div style="width:14px;height:14px;background:#ea580c;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(234,88,12,0.5);flex-shrink:0"></div>
              <span style="font-weight:600;color:#1e293b">Livreur (position GPS)</span>
            </div>
          </div>`;
        return div;
      };
      legend.addTo(map);

      mapInstanceRef.current = map;
      setIsReady(true);
    }

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ── Marqueur client ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReady || !leafletRef.current || !mapInstanceRef.current) return;
    const L = leafletRef.current;
    const map = mapInstanceRef.current;

    if (clientPosition) {
      const latlng = [clientPosition.lat, clientPosition.lng] as [number, number];
      const label = clientPosition.label ?? "Adresse de livraison";

      if (clientMarkerRef.current) {
        clientMarkerRef.current.setLatLng(latlng);
      } else {
        const clientNameRow = clientPosition.name
          ? `<div style="font-weight:700;color:#1e293b;font-size:13px;margin-bottom:2px">👤 ${clientPosition.name}</div>`
          : "";
        const clientPhoneRow = clientPosition.phone
          ? `<a href="tel:${clientPosition.phone}" style="display:flex;align-items:center;gap:4px;font-size:12px;color:#2563eb;text-decoration:none;margin-top:3px">📞 ${clientPosition.phone}</a>`
          : "";
        clientMarkerRef.current = L.marker(latlng, { icon: getClientIcon(L), zIndexOffset: 100 })
          .addTo(map)
          .bindPopup(
            `<div style="font-size:12px;color:#1e293b;min-width:150px;line-height:1.5">
               ${clientNameRow}
               <div style="color:#64748b;font-size:11px">📍 ${label}</div>
               ${clientPhoneRow}
             </div>`,
            { maxWidth: 240 }
          );
      }
    } else if (clientMarkerRef.current) {
      mapInstanceRef.current.removeLayer(clientMarkerRef.current);
      clientMarkerRef.current = null;
    }
  }, [clientPosition, isReady]);

  // ── Marqueur livreur ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReady || !leafletRef.current || !mapInstanceRef.current) return;
    const L = leafletRef.current;
    const map = mapInstanceRef.current;

    if (delivererPosition) {
      const latlng = [delivererPosition.lat, delivererPosition.lng] as [number, number];
      const label = delivererPosition.label ?? "Livreur en route";

      if (delivererMarkerRef.current) {
        delivererMarkerRef.current.setLatLng(latlng);
      } else {
        const delivererPhoneRow = delivererPosition.phone
          ? `<a href="tel:${delivererPosition.phone}" style="display:flex;align-items:center;gap:4px;font-size:12px;color:#ea580c;text-decoration:none;margin-top:3px">📞 ${delivererPosition.phone}</a>`
          : "";
        delivererMarkerRef.current = L.marker(latlng, { icon: getDelivererIcon(L), zIndexOffset: 200 })
          .addTo(map)
          .bindPopup(
            `<div style="font-size:12px;color:#1e293b;min-width:150px;line-height:1.5">
               <div style="font-weight:700;font-size:13px;margin-bottom:2px">🛵 ${label}</div>
               <div style="color:#64748b;font-size:11px">Livreur en route</div>
               ${delivererPhoneRow}
             </div>`,
            { maxWidth: 240 }
          );
      }
    } else if (delivererMarkerRef.current) {
      mapInstanceRef.current.removeLayer(delivererMarkerRef.current);
      delivererMarkerRef.current = null;
    }
  }, [delivererPosition, isReady]);

  // ── Route OSRM ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReady || !showRoute || !leafletRef.current || !mapInstanceRef.current) return;
    if (!clientPosition || !delivererPosition) return;

    const L = leafletRef.current;
    const map = mapInstanceRef.current;

    async function fetchRoute() {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${delivererPosition!.lng},${delivererPosition!.lat};${clientPosition!.lng},${clientPosition!.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        // Guard: component may have unmounted while the request was in-flight
        if (mapInstanceRef.current !== map) return;

        if (data.routes?.[0]?.geometry?.coordinates) {
          const coords = data.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );

          if (routeLineRef.current) map.removeLayer(routeLineRef.current);

          // Trait de fond blanc pour lisibilité
          L.polyline(coords, { color: "#ffffff", weight: 7, opacity: 0.7 }).addTo(map);

          routeLineRef.current = L.polyline(coords, {
            color: "#ea580c",
            weight: 4,
            opacity: 0.95,
            dashArray: "10, 6",
          }).addTo(map);

          const bounds = L.latLngBounds([
            [clientPosition!.lat, clientPosition!.lng],
            [delivererPosition!.lat, delivererPosition!.lng],
          ]);
          map.fitBounds(bounds, { padding: [60, 60] });
        }
      } catch {
        // Guard: component may have unmounted while the request was in-flight
        if (mapInstanceRef.current !== map) return;
        if (clientPosition && delivererPosition) {
          const bounds = L.latLngBounds([
            [clientPosition.lat, clientPosition.lng],
            [delivererPosition.lat, delivererPosition.lng],
          ]);
          map.fitBounds(bounds, { padding: [60, 60] });
        }
      }
    }

    fetchRoute();
  }, [clientPosition, delivererPosition, isReady, showRoute]);

  // ── Pan si un seul marqueur ──────────────────────────────────────────────
  useEffect(() => {
    if (!isReady || !mapInstanceRef.current) return;
    if (delivererPosition && !clientPosition) {
      mapInstanceRef.current.setView([delivererPosition.lat, delivererPosition.lng], 16);
    } else if (clientPosition && !delivererPosition) {
      mapInstanceRef.current.setView([clientPosition.lat, clientPosition.lng], 16);
    }
  }, [delivererPosition, clientPosition, isReady]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
