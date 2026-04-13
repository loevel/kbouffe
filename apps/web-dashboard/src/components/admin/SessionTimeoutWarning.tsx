"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@kbouffe/module-core/ui";

/** Inactivity threshold before showing the warning modal (25 min in ms) */
const WARNING_AFTER_MS = 25 * 60 * 1000;
/** Total inactivity threshold before auto-logout (30 min in ms) */
const LOGOUT_AFTER_MS = 30 * 60 * 1000;
/** Countdown duration in seconds (5 min) */
const COUNTDOWN_SECONDS = (LOGOUT_AFTER_MS - WARNING_AFTER_MS) / 1000;

function formatCountdown(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

async function signOut(): Promise<void> {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase?.auth.signOut();
    window.location.href = "/admin/login";
}

export function SessionTimeoutWarning() {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

    // Use refs for timer IDs to avoid re-renders
    const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Track when the warning started so countdown is accurate
    const warningStartedAtRef = useRef<number | null>(null);

    const clearAllTimers = useCallback(() => {
        if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current);
            warningTimerRef.current = null;
        }
        if (logoutTimerRef.current) {
            clearTimeout(logoutTimerRef.current);
            logoutTimerRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
    }, []);

    const startCountdownInterval = useCallback(() => {
        // Clear any existing countdown interval
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
        }
        warningStartedAtRef.current = Date.now();
        setCountdown(COUNTDOWN_SECONDS);

        countdownIntervalRef.current = setInterval(() => {
            if (warningStartedAtRef.current === null) return;
            const elapsed = Math.floor((Date.now() - warningStartedAtRef.current) / 1000);
            const remaining = Math.max(0, COUNTDOWN_SECONDS - elapsed);
            setCountdown(remaining);
        }, 1000);
    }, []);

    const resetTimer = useCallback(() => {
        clearAllTimers();
        setIsModalVisible(false);
        setCountdown(COUNTDOWN_SECONDS);
        warningStartedAtRef.current = null;

        // Restart warning timer
        warningTimerRef.current = setTimeout(() => {
            setIsModalVisible(true);
            startCountdownInterval();
        }, WARNING_AFTER_MS);

        // Restart logout timer
        logoutTimerRef.current = setTimeout(() => {
            signOut();
        }, LOGOUT_AFTER_MS);
    }, [clearAllTimers, startCountdownInterval]);

    // Initialize timers and attach activity listeners
    useEffect(() => {
        const events: (keyof DocumentEventMap)[] = ["mousemove", "click", "keydown"];

        const handleActivity = () => {
            // Only reset if the warning is not visible (to avoid user bypassing by moving mouse)
            if (!isModalVisible) {
                resetTimer();
            }
        };

        events.forEach((e) => document.addEventListener(e, handleActivity));

        // Start timers on mount
        resetTimer();

        return () => {
            events.forEach((e) => document.removeEventListener(e, handleActivity));
            clearAllTimers();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-attach listeners when modal visibility changes so handleActivity uses latest state
    useEffect(() => {
        const events: (keyof DocumentEventMap)[] = ["mousemove", "click", "keydown"];

        const handleActivity = () => {
            if (!isModalVisible) {
                resetTimer();
            }
        };

        events.forEach((e) => document.addEventListener(e, handleActivity));
        return () => {
            events.forEach((e) => document.removeEventListener(e, handleActivity));
        };
    }, [isModalVisible, resetTimer]);

    // Handle Escape key to close (via "stay connected")
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isModalVisible) {
                resetTimer();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isModalVisible, resetTimer]);

    const handleStayConnected = () => {
        resetTimer();
    };

    const handleSignOut = () => {
        clearAllTimers();
        signOut();
    };

    // Calculate urgency for countdown color
    const isUrgent = countdown <= 60;

    return (
        <AnimatePresence>
            {isModalVisible && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="session-timeout-title"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 12 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-800 max-w-md w-full mx-4 overflow-hidden"
                    >
                        {/* Progress bar at top */}
                        <div className="h-1 bg-surface-100 dark:bg-surface-800">
                            <motion.div
                                className={`h-full transition-colors duration-300 ${isUrgent ? "bg-red-500" : "bg-amber-500"}`}
                                style={{ width: `${(countdown / COUNTDOWN_SECONDS) * 100}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>

                        <div className="p-8 space-y-6">
                            {/* Header */}
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${isUrgent ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"}`}>
                                    <ShieldAlert size={24} />
                                </div>
                                <div>
                                    <h2
                                        id="session-timeout-title"
                                        className="text-lg font-bold text-surface-900 dark:text-white leading-tight"
                                    >
                                        Votre session va expirer
                                    </h2>
                                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                                        Inactivité détectée sur votre compte admin
                                    </p>
                                </div>
                            </div>

                            {/* Countdown display */}
                            <div className={`flex flex-col items-center justify-center py-6 rounded-xl border transition-colors duration-300 ${
                                isUrgent
                                    ? "bg-red-500/5 border-red-500/20"
                                    : "bg-amber-500/5 border-amber-500/20"
                            }`}>
                                <span className="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-2">
                                    Déconnexion automatique dans
                                </span>
                                <span className={`text-5xl font-black tabular-nums transition-colors duration-300 ${
                                    isUrgent ? "text-red-500" : "text-amber-500"
                                }`}>
                                    {formatCountdown(countdown)}
                                </span>
                                <span className="text-xs text-surface-400 mt-2">
                                    minutes : secondes
                                </span>
                            </div>

                            {/* Message */}
                            <p className="text-sm text-surface-600 dark:text-surface-400 text-center leading-relaxed">
                                Pour des raisons de sécurité, votre session sera automatiquement fermée après{" "}
                                <span className="font-semibold text-surface-900 dark:text-white">30 minutes</span>{" "}
                                d&apos;inactivité.
                            </p>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleSignOut}
                                    leftIcon={<LogOut size={16} />}
                                >
                                    Se déconnecter
                                </Button>
                                <Button
                                    variant="primary"
                                    className="flex-1"
                                    onClick={handleStayConnected}
                                    leftIcon={<RefreshCw size={16} />}
                                >
                                    Rester connecté
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
