import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Search, UtensilsCrossed, X, Loader2 } from "lucide-react";
import { usePreferencesStore } from "@/store/client-store";
import toast from "react-hot-toast";

// ── Types ──────────────────────────────────────────────────────────────────
interface FavoriteRestaurant {
    id: string; // ID du record favoris (fav_...)
    restaurantId: string;
    restaurantName: string;
    restaurantSlug: string;
    restaurantLogo: string | null;
}

// ── Favorite card ─────────────────────────────────────────────────────────────
function FavoriteCard({
    favorite,
    onRemove,
}: {
    favorite: FavoriteRestaurant;
    onRemove: () => void;
}) {
    const initial = favorite.restaurantName[0]?.toUpperCase() ?? "R";
    const colors = [
        "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
        "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
        "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
        "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    ];
    const colorIdx = favorite.restaurantSlug.charCodeAt(0) % colors.length;

    return (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600 transition-colors group">
            {/* Logo / Avatar */}
            {favorite.restaurantLogo ? (
                <img
                    src={favorite.restaurantLogo}
                    alt={favorite.restaurantName}
                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                />
            ) : (
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${colors[colorIdx]}`}>
                    {initial}
                </div>
            )}

            {/* Label + link */}
            <div className="flex-1 min-w-0">
                <Link
                    href={`/r/${favorite.restaurantSlug}`}
                    className="font-semibold text-surface-900 dark:text-white text-sm hover:text-brand-600 dark:hover:text-brand-400 transition-colors block truncate"
                >
                    {favorite.restaurantName}
                </Link>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 font-medium">/{favorite.restaurantSlug}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
                <Link
                    href={`/r/${favorite.restaurantSlug}`}
                    className="px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 text-xs font-semibold text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors opacity-0 group-hover:opacity-100"
                >
                    Commander
                </Link>
                <button
                    onClick={onRemove}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    title="Retirer des favoris"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export function FavoritesPanelReal() {
    const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const updatePrefs = usePreferencesStore((s) => s.updatePreferences);

    const fetchFavorites = async () => {
        try {
            const res = await fetch("/api/auth/favorites");
            if (res.ok) {
                const data = await res.json();
                setFavorites(data);
                
                // Sync with local store (slugs only for lightweight preference storage)
                const slugs = data.map((f: FavoriteRestaurant) => f.restaurantSlug);
                updatePrefs({ favoriteRestaurants: slugs });
            }
        } catch (error) {
            console.error("Error fetching favorites:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, []);

    const removeFavorite = async (id: string, slug: string) => {
        setIsDeleting(id);
        try {
            const res = await fetch(`/api/auth/favorites/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setFavorites((prev) => prev.filter((f) => f.id !== id));
                
                // Sync store
                const currentSlugs = favorites
                    .filter(f => f.id !== id)
                    .map(f => f.restaurantSlug);
                updatePrefs({ favoriteRestaurants: currentSlugs });
                
                toast.success("Retiré des favoris");
            } else {
                toast.error("Erreur lors de la suppression");
            }
        } catch (error) {
            toast.error("Erreur réseau");
        } finally {
            setIsDeleting(null);
        }
    };

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-4" />
                <p className="text-surface-500 text-sm">Chargement de vos favoris...</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 relative">
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">Mes favoris</h2>
                    <p className="text-surface-600 dark:text-surface-400 text-sm">
                        {favorites.length > 0
                            ? `${favorites.length} restaurant${favorites.length > 1 ? "s" : ""} enregistré${favorites.length > 1 ? "s" : ""}`
                            : "Gérez vos restaurants préférés"}
                    </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                    <Heart size={18} className="text-rose-500" fill="currentColor" />
                </div>
            </div>

            {favorites.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-surface-50 dark:bg-surface-800 flex items-center justify-center mb-4">
                        <UtensilsCrossed size={30} className="text-surface-200 dark:text-surface-700" />
                    </div>
                    <p className="text-base font-bold text-surface-900 dark:text-white mb-1">
                        Vous n'avez pas encore de favoris
                    </p>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mb-6 max-w-xs">
                        Cliquez sur le cœur ❤ lors de votre prochaine visite pour ajouter un restaurant ici.
                    </p>
                    <Link
                        href="/stores"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
                    >
                        <Search size={15} />
                        Explorer les restaurants
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {favorites.map((fav) => (
                        <div key={fav.id} className={isDeleting === fav.id ? "opacity-50 pointer-events-none transition-opacity" : ""}>
                            <FavoriteCard
                                favorite={fav}
                                onRemove={() => removeFavorite(fav.id, fav.restaurantSlug)}
                            />
                        </div>
                    ))}

                    <div className="pt-4 border-t border-surface-100 dark:border-surface-800 mt-2">
                        <Link
                            href="/stores"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                        >
                            <Search size={14} />
                            Découvrir plus de restaurants
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
