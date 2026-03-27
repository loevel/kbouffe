"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Star, ShoppingBag, X } from "lucide-react";
import { Badge, Button, Card, Spinner, adminFetch, authFetch } from "@kbouffe/module-core/ui";
import { motion, AnimatePresence } from "framer-motion";

interface Alert {
    id: string;
    level: "info" | "warn" | "error";
    message: string;
    created_at: string;
    metadata: any;
}

export function OperationalAlerts() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAlerts() {
            try {
                // Fetch technical logs filtered by restaurant and level warn/error
                const res = await authFetch("/api/restaurant/alerts");
                if (res.ok) {
                    const json = await res.json();
                    setAlerts(json.alerts || []);
                }
            } catch (err) {
                console.error("Failed to fetch alerts", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAlerts();
    }, []);

    const removeAlert = (id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    if (loading) return null;
    if (alerts.length === 0) return null;

    return (
        <div className="space-y-3 mb-6">
            <AnimatePresence>
                {alerts.map((alert) => (
                    <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, x: 20 }}
                        className="overflow-hidden"
                    >
                        <div className={`p-4 rounded-2xl border flex items-start gap-4 shadow-sm transition-all ${
                            alert.level === "warn" 
                                ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800" 
                                : "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800"
                        }`}>
                            <div className={`p-2 rounded-xl shrink-0 ${
                                alert.level === "warn" ? "bg-amber-500/20 text-amber-600" : "bg-rose-500/20 text-rose-600"
                            }`}>
                                {alert.metadata?.type === "negative_review" ? <Star size={20} fill="currentColor" /> : <AlertCircle size={20} />}
                            </div>
                            
                            <div className="flex-1 space-y-1">
                                <p className={`text-sm font-bold ${
                                    alert.level === "warn" ? "text-amber-900 dark:text-amber-100" : "text-rose-900 dark:text-rose-100"
                                }`}>
                                    {alert.message}
                                </p>
                                <p className="text-xs opacity-70 font-medium">
                                    Il y a {Math.round((Date.now() - new Date(alert.created_at).getTime()) / 60000)} minutes
                                </p>
                            </div>

                            <button 
                                onClick={() => removeAlert(alert.id)}
                                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <X size={16} className="text-surface-400" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
