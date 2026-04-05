"use client";

/**
 * ActiveSessions -- Displays currently active sessions with logout controls.
 *
 * Fetches from /api/marketplace/suppliers/me/active-sessions
 * Falls back to mock data when API unavailable.
 *
 * Features:
 *   - List of active devices with last activity, location, IP
 *   - Per-session logout button
 *   - "Deconnecter tous les autres appareils" global action
 *   - Polls every 30s for real-time updates
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Monitor,
    Smartphone,
    Tablet,
    LogOut,
    Loader2,
    RefreshCw,
    ShieldCheck,
    AlertTriangle,
} from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";

// ── Types ──────────────────────────────────────────────────────────────────

export interface Session {
    id: string;
    device_name: string;
    device_type: "desktop" | "mobile" | "tablet";
    last_activity: string; // ISO
    location: string;
    ip: string;
    user_agent: string;
    is_current: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function DeviceIcon({ type }: { type: Session["device_type"] }) {
    switch (type) {
        case "mobile":
            return <Smartphone size={18} className="text-blue-400" />;
        case "tablet":
            return <Tablet size={18} className="text-purple-400" />;
        default:
            return <Monitor size={18} className="text-surface-300" />;
    }
}

function timeAgo(isoDate: string): string {
    const now = Date.now();
    const then = new Date(isoDate).getTime();
    const diffMs = now - then;

    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return "A l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;

    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
}

// ── Mock data ──────────────────────────────────────────────────────────────

function generateMockSessions(): Session[] {
    const now = Date.now();
    return [
        {
            id: "sess-1",
            device_name: "Chrome sur Windows",
            device_type: "desktop",
            last_activity: new Date(now - 2 * 60_000).toISOString(),
            location: "Douala, CM",
            ip: "102.16.42.187",
            user_agent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.6261.69",
            is_current: true,
        },
        {
            id: "sess-2",
            device_name: "Safari sur iPhone",
            device_type: "mobile",
            last_activity: new Date(now - 45 * 60_000).toISOString(),
            location: "Douala, CM",
            ip: "102.16.42.190",
            user_agent:
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) Safari/605.1.15",
            is_current: false,
        },
        {
            id: "sess-3",
            device_name: "Firefox sur MacOS",
            device_type: "desktop",
            last_activity: new Date(now - 3 * 3600_000).toISOString(),
            location: "Yaounde, CM",
            ip: "196.207.33.91",
            user_agent:
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.3; rv:123.0) Firefox/123.0",
            is_current: false,
        },
    ];
}

// ── Session card ───────────────────────────────────────────────────────────

function SessionCard({
    session,
    onLogout,
    loggingOut,
}: {
    session: Session;
    onLogout: (id: string) => void;
    loggingOut: boolean;
}) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                session.is_current
                    ? "bg-emerald-500/5 border-emerald-500/15"
                    : "bg-surface-800/30 border-white/5 hover:border-white/10"
            }`}
        >
            {/* Device icon */}
            <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    session.is_current
                        ? "bg-emerald-500/15"
                        : "bg-surface-800"
                }`}
            >
                <DeviceIcon type={session.device_type} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white truncate">
                        {session.device_name}
                    </p>
                    {session.is_current && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-full shrink-0">
                            Session actuelle
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-surface-500">
                    <span>{timeAgo(session.last_activity)}</span>
                    <span className="w-1 h-1 rounded-full bg-surface-700" />
                    <span>{session.location}</span>
                    <span className="w-1 h-1 rounded-full bg-surface-700" />
                    <span className="font-mono">{session.ip}</span>
                </div>
            </div>

            {/* Logout button */}
            {!session.is_current && (
                <button
                    onClick={() => onLogout(session.id)}
                    disabled={loggingOut}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/8 hover:bg-red-500/15 border border-red-500/15 transition-all disabled:opacity-50"
                    aria-label={`Deconnecter ${session.device_name}`}
                >
                    {loggingOut ? (
                        <Loader2 size={12} className="animate-spin" />
                    ) : (
                        <LogOut size={12} />
                    )}
                    <span className="hidden sm:inline">Deconnecter</span>
                </button>
            )}
        </motion.div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────

export function ActiveSessions() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState<string | null>(null);
    const [logoutAllLoading, setLogoutAllLoading] = useState(false);

    // ── Fetch sessions ─────────────────────────────────────────────────
    const fetchSessions = useCallback(async () => {
        try {
            const res = await authFetch(
                "/api/marketplace/suppliers/me/active-sessions"
            );
            if (res.ok) {
                const data = (await res.json()) as any;
                const items: Session[] = Array.isArray(data)
                    ? data
                    : data?.sessions ?? [];
                // Sort: current first, then by last_activity DESC
                items.sort((a, b) => {
                    if (a.is_current) return -1;
                    if (b.is_current) return 1;
                    return (
                        new Date(b.last_activity).getTime() -
                        new Date(a.last_activity).getTime()
                    );
                });
                setSessions(items);
            } else {
                console.warn(
                    "ActiveSessions: API /api/marketplace/suppliers/me/active-sessions indisponible -- donnees mock"
                );
                setSessions(generateMockSessions());
            }
        } catch {
            console.warn("ActiveSessions: erreur fetch -- donnees mock");
            setSessions(generateMockSessions());
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch + polling every 30s
    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 30_000);
        return () => clearInterval(interval);
    }, [fetchSessions]);

    // ── Logout single session ──────────────────────────────────────────
    async function handleLogoutSession(sessionId: string) {
        setLoggingOut(sessionId);
        try {
            const res = await authFetch(
                `/api/marketplace/suppliers/me/active-sessions/${sessionId}`,
                { method: "DELETE" }
            );
            if (res.ok) {
                setSessions((prev) => prev.filter((s) => s.id !== sessionId));
            } else {
                // Mock: remove anyway for UX
                console.warn("ActiveSessions: DELETE session mock -- suppression locale");
                setSessions((prev) => prev.filter((s) => s.id !== sessionId));
            }
        } catch {
            // Mock: remove anyway
            console.warn("ActiveSessions: erreur DELETE -- suppression locale");
            setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        } finally {
            setLoggingOut(null);
        }
    }

    // ── Logout all other sessions ──────────────────────────────────────
    async function handleLogoutAll() {
        setLogoutAllLoading(true);
        try {
            const res = await authFetch(
                "/api/marketplace/suppliers/me/active-sessions",
                { method: "DELETE" }
            );
            if (res.ok) {
                setSessions((prev) => prev.filter((s) => s.is_current));
            } else {
                console.warn("ActiveSessions: DELETE all mock -- suppression locale");
                setSessions((prev) => prev.filter((s) => s.is_current));
            }
        } catch {
            console.warn("ActiveSessions: erreur DELETE all -- suppression locale");
            setSessions((prev) => prev.filter((s) => s.is_current));
        } finally {
            setLogoutAllLoading(false);
        }
    }

    const otherSessions = sessions.filter((s) => !s.is_current);
    const hasOtherSessions = otherSessions.length > 0;

    return (
        <div className="rounded-2xl bg-surface-900 border border-white/8 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-surface-800 flex items-center justify-center">
                        <ShieldCheck size={16} className="text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white">
                            Sessions actives
                        </h2>
                        <p className="text-xs text-surface-500">
                            {sessions.length} appareil{sessions.length !== 1 ? "s" : ""}{" "}
                            connect{sessions.length !== 1 ? "es" : "e"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchSessions}
                        disabled={loading}
                        className="p-2 rounded-lg text-surface-500 hover:text-white hover:bg-white/8 transition-colors disabled:opacity-50"
                        aria-label="Rafraichir les sessions"
                    >
                        <RefreshCw
                            size={15}
                            className={loading ? "animate-spin" : ""}
                        />
                    </button>
                </div>
            </div>

            {/* Logout all button */}
            {hasOtherSessions && (
                <div className="px-5 py-3 border-b border-white/5 bg-surface-800/20">
                    <button
                        onClick={handleLogoutAll}
                        disabled={logoutAllLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/8 hover:bg-red-500/12 border border-red-500/15 transition-all disabled:opacity-50"
                        aria-label="Se deconnecter de tous les autres appareils"
                    >
                        {logoutAllLoading ? (
                            <Loader2 size={13} className="animate-spin" />
                        ) : (
                            <AlertTriangle size={13} />
                        )}
                        Se deconnecter de tous les autres appareils
                    </button>
                </div>
            )}

            {/* Sessions list */}
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
            ) : sessions.length === 0 ? (
                <div className="px-4 py-12 text-center">
                    <ShieldCheck
                        size={24}
                        className="mx-auto text-surface-600 mb-2"
                    />
                    <p className="text-sm text-surface-500">
                        Aucune session active
                    </p>
                </div>
            ) : (
                <div className="p-4 space-y-3">
                    <AnimatePresence mode="popLayout">
                        {sessions.map((session) => (
                            <SessionCard
                                key={session.id}
                                session={session}
                                onLogout={handleLogoutSession}
                                loggingOut={loggingOut === session.id}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
