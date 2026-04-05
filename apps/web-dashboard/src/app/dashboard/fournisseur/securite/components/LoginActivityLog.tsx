"use client";

/**
 * LoginActivityLog -- Displays last 20 login events.
 *
 * Fetches from /api/marketplace/suppliers/me/login-history?limit=20
 * Falls back to mock data when API unavailable.
 *
 * Features:
 *   - Expandable rows (IP + user agent details)
 *   - Device icon detection (desktop/mobile/tablet)
 *   - "Actuel" badge for current session
 *   - Sorted by date DESC
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Monitor,
    Smartphone,
    Tablet,
    ChevronDown,
    CheckCircle,
    XCircle,
    Shield,
    Loader2,
    RefreshCw,
} from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";

// ── Types ──────────────────────────────────────────────────────────────────

export interface LoginEvent {
    id: string;
    date: string; // ISO
    device: "desktop" | "mobile" | "tablet";
    ip: string;
    location: string;
    status: "success" | "failed";
    user_agent: string;
    is_current: boolean;
}

// ── Device icon helper ─────────────────────────────────────────────────────

function DeviceIcon({ device }: { device: LoginEvent["device"] }) {
    switch (device) {
        case "mobile":
            return <Smartphone size={15} className="text-blue-400" />;
        case "tablet":
            return <Tablet size={15} className="text-purple-400" />;
        default:
            return <Monitor size={15} className="text-surface-400" />;
    }
}

function deviceLabel(device: LoginEvent["device"]): string {
    switch (device) {
        case "mobile":
            return "Mobile";
        case "tablet":
            return "Tablette";
        default:
            return "Ordinateur";
    }
}

// ── Mock data generator ────────────────────────────────────────────────────

function generateMockLogins(): LoginEvent[] {
    const devices: LoginEvent["device"][] = ["desktop", "mobile", "tablet"];
    const locations = [
        "Douala, CM",
        "Yaounde, CM",
        "Bafoussam, CM",
        "Bamenda, CM",
        "Garoua, CM",
        "Maroua, CM",
    ];
    const uas = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3) Safari/605.1.15",
        "Mozilla/5.0 (iPad; CPU OS 17_2) Safari/605.1.15",
        "Mozilla/5.0 (Linux; Android 14) Chrome/122.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) Firefox/123.0",
    ];

    const now = Date.now();
    const logins: LoginEvent[] = [];

    for (let i = 0; i < 20; i++) {
        const hoursAgo = i * 3 + Math.floor(Math.random() * 3);
        const device = devices[Math.floor(Math.random() * devices.length)];
        logins.push({
            id: `login-${i}`,
            date: new Date(now - hoursAgo * 3600_000).toISOString(),
            device,
            ip: `${102 + Math.floor(Math.random() * 50)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
            location: locations[Math.floor(Math.random() * locations.length)],
            status: i < 18 ? "success" : "failed",
            user_agent: uas[Math.floor(Math.random() * uas.length)],
            is_current: i === 0,
        });
    }

    return logins;
}

// ── Expandable row ─────────────────────────────────────────────────────────

function LoginRow({ login }: { login: LoginEvent }) {
    const [expanded, setExpanded] = useState(false);

    const date = new Date(login.date);
    const dateStr = date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
    const timeStr = date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
    });

    // Mask IP for display (show partial)
    const maskedIp = login.ip.replace(/\.\d+$/, ".***");

    return (
        <div className="border-b border-white/5 last:border-b-0">
            <button
                onClick={() => setExpanded((prev) => !prev)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors text-left"
                aria-expanded={expanded}
                aria-label={`Connexion du ${dateStr} a ${timeStr}`}
            >
                {/* Device */}
                <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center shrink-0">
                    <DeviceIcon device={login.device} />
                </div>

                {/* Date + time */}
                <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-5 gap-1 sm:gap-3 items-center">
                    <span className="text-sm text-white font-medium truncate">
                        {dateStr}
                    </span>
                    <span className="text-sm text-surface-400 truncate">
                        {timeStr}
                    </span>
                    <span className="hidden sm:block text-sm text-surface-400 truncate">
                        {deviceLabel(login.device)}
                    </span>
                    <span className="hidden sm:block text-sm text-surface-500 font-mono truncate">
                        {maskedIp}
                    </span>
                    <span className="hidden sm:block text-sm text-surface-400 truncate">
                        {login.location}
                    </span>
                </div>

                {/* Status + badges */}
                <div className="flex items-center gap-2 shrink-0">
                    {login.is_current && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-full">
                            Actuel
                        </span>
                    )}
                    {login.status === "success" ? (
                        <CheckCircle size={14} className="text-emerald-400" />
                    ) : (
                        <XCircle size={14} className="text-red-400" />
                    )}
                    <ChevronDown
                        size={14}
                        className={`text-surface-600 transition-transform duration-200 ${
                            expanded ? "rotate-180" : ""
                        }`}
                    />
                </div>
            </button>

            {/* Expanded details */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-3 pt-0 pl-16">
                            <div className="rounded-xl bg-surface-800/50 border border-white/5 p-3 space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-surface-600 tracking-wider">
                                            Adresse IP complete
                                        </p>
                                        <p className="text-sm font-mono text-surface-300 mt-0.5">
                                            {login.ip}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-surface-600 tracking-wider">
                                            Localisation
                                        </p>
                                        <p className="text-sm text-surface-300 mt-0.5">
                                            {login.location}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-surface-600 tracking-wider">
                                        User Agent
                                    </p>
                                    <p className="text-xs text-surface-500 mt-0.5 break-all leading-relaxed">
                                        {login.user_agent}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                    <p className="text-[10px] uppercase font-bold text-surface-600 tracking-wider">
                                        Statut
                                    </p>
                                    <span
                                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                            login.status === "success"
                                                ? "bg-emerald-500/15 text-emerald-400"
                                                : "bg-red-500/15 text-red-400"
                                        }`}
                                    >
                                        {login.status === "success" ? "Succes" : "Echec"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────

export function LoginActivityLog() {
    const [logins, setLogins] = useState<LoginEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogins = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch(
                "/api/marketplace/suppliers/me/login-history?limit=20"
            );
            if (res.ok) {
                const data = (await res.json()) as any;
                const items: LoginEvent[] = Array.isArray(data)
                    ? data
                    : data?.logins ?? [];
                // Sort DESC by date
                items.sort(
                    (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                setLogins(items);
            } else {
                console.warn(
                    "LoginActivityLog: API /api/marketplace/suppliers/me/login-history indisponible -- donnees mock"
                );
                setLogins(generateMockLogins());
            }
        } catch {
            console.warn(
                "LoginActivityLog: erreur fetch -- donnees mock"
            );
            setLogins(generateMockLogins());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogins();
    }, [fetchLogins]);

    return (
        <div className="rounded-2xl bg-surface-900 border border-white/8 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-surface-800 flex items-center justify-center">
                        <Shield size={16} className="text-surface-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white">
                            Historique de connexion
                        </h2>
                        <p className="text-xs text-surface-500">
                            Derniers 20 evenements de connexion
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchLogins}
                    disabled={loading}
                    className="p-2 rounded-lg text-surface-500 hover:text-white hover:bg-white/8 transition-colors disabled:opacity-50"
                    aria-label="Rafraichir l'historique"
                >
                    <RefreshCw
                        size={15}
                        className={loading ? "animate-spin" : ""}
                    />
                </button>
            </div>

            {/* Table header (desktop only) */}
            <div className="hidden sm:grid grid-cols-[48px_1fr_auto] gap-3 px-4 py-2 bg-surface-800/30 border-b border-white/5">
                <span />
                <div className="grid grid-cols-5 gap-3">
                    <span className="text-[10px] uppercase font-bold text-surface-600 tracking-wider">
                        Date
                    </span>
                    <span className="text-[10px] uppercase font-bold text-surface-600 tracking-wider">
                        Heure
                    </span>
                    <span className="text-[10px] uppercase font-bold text-surface-600 tracking-wider">
                        Appareil
                    </span>
                    <span className="text-[10px] uppercase font-bold text-surface-600 tracking-wider">
                        IP
                    </span>
                    <span className="text-[10px] uppercase font-bold text-surface-600 tracking-wider">
                        Localisation
                    </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-surface-600 tracking-wider text-right pr-2">
                    Statut
                </span>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2
                        size={20}
                        className="text-surface-500 animate-spin"
                    />
                    <span className="text-sm text-surface-500 ml-3">
                        Chargement...
                    </span>
                </div>
            ) : logins.length === 0 ? (
                <div className="px-4 py-12 text-center">
                    <Shield
                        size={24}
                        className="mx-auto text-surface-600 mb-2"
                    />
                    <p className="text-sm text-surface-500">
                        Aucun historique de connexion
                    </p>
                </div>
            ) : (
                <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-surface-700 scrollbar-track-transparent">
                    {logins.map((login) => (
                        <LoginRow key={login.id} login={login} />
                    ))}
                </div>
            )}
        </div>
    );
}
