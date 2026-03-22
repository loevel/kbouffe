"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
    CalendarClock,
    CheckCircle2,
    Clock,
    Loader2,
    MapPin,
    Users,
    X,
    XCircle,
    PartyPopper,
    ChefHat,
    Star,
    Send,
} from "lucide-react";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ClientReservation {
    id: string;
    restaurant_id: string;
    customer_name: string;
    customer_phone: string | null;
    customer_email: string | null;
    party_size: number;
    date: string;
    time: string;
    duration: number | null;
    status: string;
    occasion: string | null;
    zone_id: string | null;
    table_id: string | null;
    special_requests: string | null;
    cancellation_reason: string | null;
    created_at: string;
    restaurants: {
        id: string;
        name: string;
        slug: string;
        logo_url: string | null;
    } | null;
    table_zones: {
        id: string;
        name: string;
        type: string;
        color: string;
        image_url: string | null;
    } | null;
    restaurant_tables: {
        number: number;
    } | null;
}

// ── Status display ────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending:   { label: "En attente",   color: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300 border-yellow-100 dark:border-yellow-500/20",   icon: <Clock size={12} /> },
    confirmed: { label: "Confirmée",    color: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border-blue-100 dark:border-blue-500/20",               icon: <CheckCircle2 size={12} /> },
    seated:    { label: "Installé",     color: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300 border-green-100 dark:border-green-500/20",         icon: <CheckCircle2 size={12} /> },
    completed: { label: "Terminée",     color: "bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300 border-surface-200 dark:border-surface-700", icon: <CheckCircle2 size={12} /> },
    no_show:   { label: "Absent",       color: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300 border-orange-100 dark:border-orange-500/20",   icon: <XCircle size={12} /> },
    cancelled: { label: "Annulée",      color: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300 border-red-100 dark:border-red-500/20",                    icon: <X size={12} /> },
};

const OCCASION_LABELS: Record<string, { label: string; icon: string }> = {
    birthday:    { label: "Anniversaire", icon: "🎂" },
    dinner:      { label: "Dîner",        icon: "🍽️" },
    surprise:    { label: "Surprise",     icon: "🎁" },
    business:    { label: "Business",     icon: "💼" },
    anniversary: { label: "Célébration",  icon: "💍" },
    date:        { label: "Rendez-vous",  icon: "❤️" },
    family:      { label: "Famille",      icon: "👨‍👩‍👧‍👦" },
    other:       { label: "Autre",        icon: "📌" },
};

// ── Reservation card ──────────────────────────────────────────────────────────
function ReservationCard({
    reservation,
    onCancel,
    isCancelling,
    onSubmitReview,
    isSubmittingReview,
}: {
    reservation: ClientReservation;
    onCancel?: (id: string) => Promise<void>;
    isCancelling?: boolean;
    onSubmitReview?: (reservationId: string, restaurantId: string, rating: number, comment: string) => Promise<boolean>;
    isSubmittingReview?: boolean;
}) {
    const [showReview, setShowReview] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);

    const meta = STATUS_MAP[reservation.status] ?? STATUS_MAP.pending;
    const occasion = reservation.occasion ? OCCASION_LABELS[reservation.occasion] : null;
    const isPast = ["completed", "no_show", "cancelled"].includes(reservation.status);
    const cancellable = ["pending", "confirmed"].includes(reservation.status);
    const reviewable = reservation.status === "completed";

    const dateLabel = new Date(`${reservation.date}T${reservation.time}`).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <div className={`rounded-2xl border transition-all ${
            isPast
                ? "border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 opacity-75"
                : "border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm hover:shadow-md"
        }`}>
            <div className="p-4 sm:p-5">
                {/* Header: restaurant + status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                        {reservation.restaurants?.logo_url ? (
                            <img
                                src={reservation.restaurants.logo_url}
                                alt=""
                                className="w-10 h-10 rounded-xl object-cover shrink-0"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                                <ChefHat size={18} className="text-brand-500" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <Link
                                href={`/r/${reservation.restaurants?.slug ?? ""}`}
                                className="font-bold text-sm text-surface-900 dark:text-white hover:text-brand-500 transition-colors truncate block"
                            >
                                {reservation.restaurants?.name ?? "Restaurant"}
                            </Link>
                            <p className="text-xs text-surface-500 capitalize">{dateLabel}</p>
                        </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.color}`}>
                        {meta.icon}
                        {meta.label}
                    </span>
                </div>

                {/* Details grid */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-surface-600 dark:text-surface-400">
                    <span className="inline-flex items-center gap-1.5">
                        <Clock size={14} className="text-surface-400" />
                        {reservation.time.slice(0, 5)}
                        {reservation.duration && (
                            <span className="text-xs text-surface-400">· {reservation.duration}min</span>
                        )}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <Users size={14} className="text-surface-400" />
                        {reservation.party_size} pers.
                    </span>
                    {reservation.table_zones && (
                        <span className="inline-flex items-center gap-1.5">
                            <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: reservation.table_zones.color ?? "#6366f1" }}
                            />
                            {reservation.table_zones.name}
                        </span>
                    )}
                    {reservation.restaurant_tables && (
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin size={14} className="text-surface-400" />
                            Table #{reservation.restaurant_tables.number}
                        </span>
                    )}
                    {occasion && (
                        <span className="inline-flex items-center gap-1.5">
                            <span>{occasion.icon}</span>
                            {occasion.label}
                        </span>
                    )}
                </div>

                {/* Special requests */}
                {reservation.special_requests && (
                    <p className="mt-2 text-xs text-surface-500 italic bg-surface-50 dark:bg-surface-800/50 rounded-lg px-3 py-2">
                        {reservation.special_requests}
                    </p>
                )}

                {/* Cancellation reason */}
                {reservation.status === "cancelled" && reservation.cancellation_reason && (
                    <p className="mt-2 text-xs text-red-500 font-medium">
                        Raison : {reservation.cancellation_reason}
                    </p>
                )}

                {/* Cancel button */}
                {cancellable && onCancel && (
                    <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-800">
                        <button
                            onClick={() => onCancel(reservation.id)}
                            disabled={isCancelling}
                            className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                            {isCancelling ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : (
                                <X size={12} />
                            )}
                            Annuler la réservation
                        </button>
                    </div>
                )}

                {/* Review action for completed reservations */}
                {reviewable && onSubmitReview && !reviewSubmitted && (
                    <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-800 space-y-3">
                        {!showReview ? (
                            <button
                                onClick={() => setShowReview(true)}
                                className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors inline-flex items-center gap-1.5"
                            >
                                <Star size={12} />
                                Laisser un avis
                            </button>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((value) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setRating(value)}
                                            className="p-0.5"
                                            aria-label={`Noter ${value} sur 5`}
                                        >
                                            <Star
                                                size={16}
                                                className={value <= rating ? "text-amber-500 fill-amber-500" : "text-surface-300 dark:text-surface-700"}
                                            />
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Votre avis (optionnel)"
                                    className="w-full min-h-[72px] rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                                />

                                {reviewError && (
                                    <p className="text-xs text-red-500">{reviewError}</p>
                                )}

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            setReviewError(null);
                                            const ok = await onSubmitReview(reservation.id, reservation.restaurant_id, rating, comment.trim());
                                            if (ok) {
                                                setReviewSubmitted(true);
                                                setShowReview(false);
                                            } else {
                                                setReviewError("Impossible d'envoyer l'avis.");
                                            }
                                        }}
                                        disabled={isSubmittingReview}
                                        className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                                    >
                                        {isSubmittingReview ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                        {isSubmittingReview ? "Envoi..." : "Envoyer"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowReview(false)}
                                        className="text-xs text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {reviewSubmitted && (
                    <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-800">
                        <p className="text-xs font-medium text-green-600 dark:text-green-400">
                            Merci ! Votre avis a été envoyé.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function ReservationsPanelReal() {
    const [reservations, setReservations] = useState<ClientReservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancellingId, setIsCancellingId] = useState<string | null>(null);
    const [isSubmittingReviewId, setIsSubmittingReviewId] = useState<string | null>(null);

    const fetchReservations = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/reservations");
            if (res.ok) {
                const data = await res.json();
                setReservations(data);
            }
        } catch (error) {
            console.error("Error fetching reservations:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);

    const handleCancel = async (id: string) => {
        if (isCancellingId) return;
        setIsCancellingId(id);
        try {
            const res = await fetch("/api/auth/reservations", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, action: "cancel" }),
            });
            if (res.ok) {
                toast.success("Réservation annulée");
                await fetchReservations();
            } else {
                const err = await res.json();
                toast.error(err.error || "Impossible d'annuler");
            }
        } catch {
            toast.error("Erreur réseau");
        } finally {
            setIsCancellingId(null);
        }
    };

    const handleSubmitReview = async (
        reservationId: string,
        restaurantId: string,
        rating: number,
        comment: string
    ) => {
        if (isSubmittingReviewId) return false;
        setIsSubmittingReviewId(reservationId);
        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    restaurantId,
                    rating,
                    comment: comment || undefined,
                }),
            });

            if (res.ok) {
                toast.success("Merci pour votre avis");
                return true;
            }

            const err = await res.json().catch(() => ({}));
            toast.error(err?.error || "Impossible d'envoyer l'avis");
            return false;
        } catch {
            toast.error("Erreur réseau");
            return false;
        } finally {
            setIsSubmittingReviewId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-4" />
                <p className="text-surface-500 text-sm">Chargement de vos réservations...</p>
            </div>
        );
    }

    if (reservations.length === 0) {
        return (
            <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-8 text-center">
                <CalendarClock size={48} className="mx-auto text-surface-200 dark:text-surface-700 mb-4" />
                <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                    Aucune réservation
                </h2>
                <p className="text-surface-500 dark:text-surface-400 text-sm mb-6 max-w-xs mx-auto">
                    Vos réservations apparaîtront ici. Réservez une table dans votre restaurant préféré !
                </p>
                <Link
                    href="/stores"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors text-sm"
                >
                    <ChefHat size={16} />
                    Explorer les restaurants
                </Link>
            </div>
        );
    }

    const upcoming = reservations.filter((r) =>
        ["pending", "confirmed"].includes(r.status)
    );
    const active = reservations.filter((r) => r.status === "seated");
    const past = reservations.filter((r) =>
        ["completed", "no_show", "cancelled"].includes(r.status)
    );

    return (
        <div className="space-y-6">
            {/* Seated now */}
            {active.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                        <PartyPopper size={16} className="text-green-500" />
                        En cours
                    </h2>
                    <div className="space-y-3">
                        {active.map((r) => (
                            <ReservationCard key={r.id} reservation={r} />
                        ))}
                    </div>
                </section>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                        <CalendarClock size={16} className="text-brand-500" />
                        À venir
                        <span className="ml-1 text-sm font-normal text-surface-500">({upcoming.length})</span>
                    </h2>
                    <div className="space-y-3">
                        {upcoming.map((r) => (
                            <ReservationCard
                                key={r.id}
                                reservation={r}
                                onCancel={handleCancel}
                                isCancelling={isCancellingId === r.id}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Past */}
            {past.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                        <Clock size={16} className="text-surface-400" />
                        Historique
                        <span className="ml-1 text-sm font-normal text-surface-500">({past.length})</span>
                    </h2>
                    <div className="space-y-3">
                        {past.map((r) => (
                            <ReservationCard
                                key={r.id}
                                reservation={r}
                                onSubmitReview={handleSubmitReview}
                                isSubmittingReview={isSubmittingReviewId === r.id}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
