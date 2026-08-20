import { Hono } from "hono";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Env, Variables } from "../../types";

/**
 * Routes livreur — app mobile livreur.
 *
 * Qui est livreur ? Kbouffe ne fournit pas de flotte (cf. DeliverySettingsForm) :
 * un livreur est un membre d'équipe d'un restaurant, ligne `restaurant_members`
 * avec `role = 'driver'` et `status = 'active'`. Attention, ce n'est PAS
 * `users.role` : l'enum `user_role` n'a ni « driver » ni « livreur » (le seul
 * livreur en base porte `users.role = 'customer'`), et le rôle « livreur » que
 * lit le middleware web vient des métadonnées auth, pas de la table. Se fier à
 * `users.role` reviendrait à refuser l'accès à tous les livreurs.
 *
 * Une course est une ligne de `orders` dont `driver_id` vaut son identifiant.
 *
 * IMPORTANT — sécurité : `orders` n'a AUCUNE politique RLS pour les livreurs
 * (seuls le client et le restaurateur en ont une). Ces routes travaillent donc
 * avec la clé de service, et chaque requête DOIT être filtrée sur
 * `driver_id = userId`. Rien ici ne doit lire ou écrire une commande sans ce
 * filtre : c'est le seul rempart.
 *
 * - GET   /driver/me                    — profil + disponibilité
 * - PATCH /driver/me                    — bascule disponible / indisponible
 * - GET   /driver/orders                — courses en cours
 * - PATCH /driver/orders/:id            — prise en charge / livraison (code)
 * - GET   /driver/history               — courses terminées, paginées
 * - GET   /driver/earnings              — gains agrégés
 * - POST  /driver/tracking/:orderId     — position GPS (ouvre le suivi au besoin)
 */

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

/** Statuts d'une course encore en main du livreur. */
const STATUTS_ACTIFS = ["ready", "out_for_delivery", "delivering"] as const;
/** Statuts d'une course terminée. */
const STATUTS_TERMINES = ["delivered", "completed"] as const;

/** Transitions autorisées, et depuis quel statut. */
const TRANSITIONS = {
    pickup: { from: ["ready"], to: "out_for_delivery" },
    deliver: { from: ["out_for_delivery", "delivering"], to: "delivered" },
} as const;

type ActionLivreur = keyof typeof TRANSITIONS;

/**
 * Client à clé de service. Sans RLS pour les livreurs, c'est le seul moyen de
 * lire les courses assignées — d'où le filtre `driver_id` obligatoire partout.
 */
function serviceDb(c: any): SupabaseClient | null {
    if (!c.env.SUPABASE_SERVICE_ROLE_KEY) return null;
    return createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

/** Vrai si le compte est livreur actif d'au moins un restaurant. */
async function estLivreur(db: SupabaseClient, userId: string): Promise<boolean> {
    const { data } = await db
        .from("restaurant_members")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "driver")
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
    return Boolean((data as any)?.id);
}

/** Colonnes d'une course, telles que l'app livreur les consomme. */
const COURSE_SELECT = `
    id, customer_name, customer_phone, delivery_address, items, total,
    delivery_fee, status, notes, delivery_code, created_at, delivered_at,
    updated_at, restaurant_id, restaurants ( name, address, phone, lat, lng )
`;

function mapCourse(row: any, suivi?: { client_lat: number | null; client_lng: number | null }) {
    const resto = Array.isArray(row.restaurants) ? row.restaurants[0] : row.restaurants;
    return {
        id: row.id,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        deliveryAddress: row.delivery_address,
        // Coordonnées du client : elles vivent dans delivery_tracking, pas dans
        // orders. Sans elles, l'app n'a qu'une adresse en texte à géocoder.
        customerLat: suivi?.client_lat ?? null,
        customerLng: suivi?.client_lng ?? null,
        items: row.items ?? [],
        total: row.total ?? 0,
        deliveryFee: row.delivery_fee ?? 0,
        status: row.status,
        notes: row.notes ?? null,
        createdAt: row.created_at,
        deliveredAt: row.delivered_at ?? null,
        // Toutes les commandes livrées ne portent pas `delivered_at` : celles
        // passées à « livrée » depuis le tableau de bord ne l'ont jamais reçu
        // (3 sur 9 en base). `updated_at`, lui, est toujours renseigné et
        // jamais antérieur à `delivered_at` : il sert de repli pour dater la
        // course, ici comme dans le calcul des gains.
        updatedAt: row.updated_at ?? null,
        restaurant: {
            id: row.restaurant_id,
            name: resto?.name ?? "Restaurant",
            address: resto?.address ?? null,
            phone: resto?.phone ?? null,
            lat: resto?.lat ?? null,
            lng: resto?.lng ?? null,
        },
        // Le code de confirmation n'est JAMAIS renvoyé au livreur : c'est le
        // client qui le lui dicte, sinon la vérification ne prouve plus rien.
        requiresCode: Boolean(row.delivery_code),
    };
}

/** Charge les coordonnées client des courses données, indexées par order_id. */
async function chargerSuivis(db: SupabaseClient, orderIds: string[]) {
    if (orderIds.length === 0) return new Map<string, any>();
    const { data } = await db
        .from("delivery_tracking")
        .select("order_id, client_lat, client_lng")
        .in("order_id", orderIds);
    return new Map((data ?? []).map((t: any) => [t.order_id, t]));
}

// ── Profil et disponibilité ──────────────────────────────────────────────────

router.get("/me", async (c: any) => {
    try {
        const db = serviceDb(c);
        if (!db) return c.json({ error: "Service non configuré" }, 500);
        const userId = c.var.userId;

        if (!(await estLivreur(db, userId))) {
            return c.json({ error: "Accès réservé aux livreurs" }, 403);
        }

        const { data, error } = await db
            .from("users")
            .select("id, full_name, phone, email, avatar_url, preferences")
            .eq("id", userId)
            .maybeSingle();

        if (error) {
            console.error("[Driver API] me error:", error);
            return c.json({ error: "Erreur lors du chargement du profil" }, 500);
        }
        if (!data) return c.json({ error: "Compte introuvable" }, 404);

        const prefs = ((data as any).preferences ?? {}) as Record<string, unknown>;
        return c.json({
            id: (data as any).id,
            fullName: (data as any).full_name,
            phone: (data as any).phone,
            email: (data as any).email,
            avatarUrl: (data as any).avatar_url,
            // La disponibilité vit dans users.preferences : pas de colonne dédiée
            // en base, et un livreur est considéré disponible par défaut.
            available: prefs.driver_available !== false,
        });
    } catch (error) {
        console.error("[Driver API] me error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});

router.patch("/me", async (c: any) => {
    try {
        const db = serviceDb(c);
        if (!db) return c.json({ error: "Service non configuré" }, 500);
        const userId = c.var.userId;

        const body = await c.req.json().catch(() => ({}));
        if (typeof body?.available !== "boolean") {
            return c.json({ error: "Le champ « available » (booléen) est requis" }, 400);
        }

        if (!(await estLivreur(db, userId))) {
            return c.json({ error: "Accès réservé aux livreurs" }, 403);
        }

        const { data: current } = await db
            .from("users")
            .select("preferences")
            .eq("id", userId)
            .maybeSingle();

        const prefs = {
            ...(((current as any)?.preferences ?? {}) as object),
            driver_available: body.available,
        };

        const { error } = await db.from("users").update({ preferences: prefs }).eq("id", userId);
        if (error) {
            console.error("[Driver API] availability error:", error);
            return c.json({ error: "Impossible d'enregistrer la disponibilité" }, 500);
        }

        return c.json({ success: true, available: body.available });
    } catch (error) {
        console.error("[Driver API] availability error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});

// ── Courses en cours ─────────────────────────────────────────────────────────

router.get("/orders", async (c: any) => {
    try {
        const db = serviceDb(c);
        if (!db) return c.json({ error: "Service non configuré" }, 500);

        const { data, error } = await db
            .from("orders")
            .select(COURSE_SELECT)
            .eq("driver_id", c.var.userId)
            .in("status", STATUTS_ACTIFS as unknown as string[])
            .order("created_at", { ascending: true });

        if (error) {
            console.error("[Driver API] orders error:", error);
            return c.json({ error: "Erreur lors du chargement des courses" }, 500);
        }

        const suivis = await chargerSuivis(db, (data ?? []).map((o: any) => o.id));
        return c.json({ orders: (data ?? []).map((o: any) => mapCourse(o, suivis.get(o.id))) });
    } catch (error) {
        console.error("[Driver API] orders error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});

router.patch("/orders/:id", async (c: any) => {
    try {
        const db = serviceDb(c);
        if (!db) return c.json({ error: "Service non configuré" }, 500);
        const userId = c.var.userId;
        const id = c.req.param("id");

        const body = await c.req.json().catch(() => ({}));
        const action: ActionLivreur = body?.action === "pickup" ? "pickup" : "deliver";
        const code = body?.delivery_code ? String(body.delivery_code).trim().toUpperCase() : undefined;

        if (action === "deliver" && !code) {
            return c.json({ error: "Le code de confirmation est requis" }, 400);
        }

        const { from, to } = TRANSITIONS[action];

        const { data: order, error: fetchError } = await db
            .from("orders")
            .select("id, status, delivery_code")
            .eq("id", id)
            .eq("driver_id", userId) // ← sans ce filtre, n'importe quel livreur passerait
            .in("status", from as unknown as string[])
            .maybeSingle();

        if (fetchError || !order) {
            return c.json({ error: "Course introuvable ou déjà traitée" }, 404);
        }

        if (action === "deliver") {
            const attendu = (order as any).delivery_code;
            if (!attendu || String(attendu).trim().toUpperCase() !== code) {
                return c.json({ error: "Code incorrect. Demandez le code au client." }, 400);
            }
        }

        const maintenant = new Date().toISOString();
        const patch: Record<string, string> = { status: to, updated_at: maintenant };
        if (action === "deliver") patch.delivered_at = maintenant;

        const { error: updateError } = await db
            .from("orders")
            .update(patch)
            .eq("id", id)
            .eq("driver_id", userId);

        if (updateError) {
            console.error("[Driver API] transition error:", updateError);
            return c.json({ error: "La mise à jour a échoué" }, 500);
        }

        // La course terminée ferme aussi son suivi, sinon le client garde une
        // carte qui bouge encore après avoir reçu sa commande.
        if (action === "deliver") {
            await db
                .from("delivery_tracking")
                .update({ status: "completed", completed_at: maintenant, updated_at: maintenant })
                .eq("order_id", id);
        }

        return c.json({ success: true, status: to });
    } catch (error) {
        console.error("[Driver API] transition error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});

// ── Historique ───────────────────────────────────────────────────────────────

router.get("/history", async (c: any) => {
    try {
        const db = serviceDb(c);
        if (!db) return c.json({ error: "Service non configuré" }, 500);

        const limit = Math.min(Math.max(parseInt(c.req.query("limit") ?? "20", 10) || 20, 1), 50);
        const page = Math.max(parseInt(c.req.query("page") ?? "1", 10) || 1, 1);
        const offset = (page - 1) * limit;

        const { data, error, count } = await db
            .from("orders")
            .select(COURSE_SELECT, { count: "exact" })
            .eq("driver_id", c.var.userId)
            .in("status", STATUTS_TERMINES as unknown as string[])
            // Trier sur delivered_at ferait couler au fond de la liste, page
            // après page, les courses qui n'ont pas reçu cet horodatage.
            .order("updated_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error("[Driver API] history error:", error);
            return c.json({ error: "Erreur lors du chargement de l'historique" }, 500);
        }

        const total = count ?? 0;
        return c.json({
            orders: (data ?? []).map((o: any) => mapCourse(o)),
            page,
            limit,
            total,
            hasMore: offset + limit < total,
        });
    } catch (error) {
        console.error("[Driver API] history error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});

// ── Gains ────────────────────────────────────────────────────────────────────

/** Début de journée / semaine / mois, en ISO. */
function debutDe(periode: "jour" | "semaine" | "mois"): string {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (periode === "semaine") {
        // Semaine commençant le lundi.
        const jour = (d.getDay() + 6) % 7;
        d.setDate(d.getDate() - jour);
    }
    if (periode === "mois") d.setDate(1);
    return d.toISOString();
}

router.get("/earnings", async (c: any) => {
    try {
        const db = serviceDb(c);
        if (!db) return c.json({ error: "Service non configuré" }, 500);

        const debutMois = debutDe("mois");

        // Filtrer sur updated_at, pas sur delivered_at : ce dernier manque sur
        // une partie des commandes livrées, qui disparaîtraient alors des gains
        // sans laisser de trace. updated_at n'étant jamais antérieur à
        // delivered_at, ce filtre est un sur-ensemble — le tri fin se fait
        // ci-dessous, sur la date effective de chaque course.
        const { data, error } = await db
            .from("orders")
            .select("delivery_fee, delivered_at, updated_at")
            .eq("driver_id", c.var.userId)
            .in("status", STATUTS_TERMINES as unknown as string[])
            .gte("updated_at", debutMois);

        if (error) {
            console.error("[Driver API] earnings error:", error);
            return c.json({ error: "Erreur lors du calcul des gains" }, 500);
        }

        const debutJour = debutDe("jour");
        const debutSemaine = debutDe("semaine");

        // Les gains du livreur sont les frais de livraison des courses qu'il a
        // effectivement livrées. Aucune commission n'est modélisée en base : ne
        // rien inventer ici, le chiffre doit rester vérifiable ligne à ligne.
        const agrege = { jour: 0, semaine: 0, mois: 0, coursesJour: 0, coursesSemaine: 0, coursesMois: 0 };

        for (const o of data ?? []) {
            const frais = (o as any).delivery_fee ?? 0;
            const quand = ((o as any).delivered_at ?? (o as any).updated_at) as string | null;
            if (!quand || quand < debutMois) continue;

            agrege.mois += frais;
            agrege.coursesMois += 1;
            if (quand >= debutSemaine) {
                agrege.semaine += frais;
                agrege.coursesSemaine += 1;
            }
            if (quand >= debutJour) {
                agrege.jour += frais;
                agrege.coursesJour += 1;
            }
        }

        return c.json(agrege);
    } catch (error) {
        console.error("[Driver API] earnings error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});

// ── Position GPS ─────────────────────────────────────────────────────────────

router.post("/tracking/:orderId", async (c: any) => {
    try {
        const db = serviceDb(c);
        if (!db) return c.json({ error: "Service non configuré" }, 500);
        const userId = c.var.userId;
        const orderId = c.req.param("orderId");

        const body = await c.req.json().catch(() => ({}));
        const lat = Number(body?.lat);
        const lng = Number(body?.lng);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return c.json({ error: "lat et lng sont requis (nombres)" }, 400);
        }
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return c.json({ error: "Coordonnées hors limites" }, 400);
        }

        // La course doit être la sienne et encore en cours : sans ce contrôle,
        // un livreur pourrait déplacer le point d'une livraison qui ne le
        // concerne pas, ou continuer à émettre après l'avoir terminée.
        const { data: order } = await db
            .from("orders")
            .select("id, restaurant_id, delivery_address")
            .eq("id", orderId)
            .eq("driver_id", userId)
            .in("status", STATUTS_ACTIFS as unknown as string[])
            .maybeSingle();

        if (!order) return c.json({ error: "Course introuvable ou déjà terminée" }, 404);

        const maintenant = new Date().toISOString();
        const { data: misAJour, error: erreurMaj } = await db
            .from("delivery_tracking")
            .update({ deliverer_lat: lat, deliverer_lng: lng, updated_at: maintenant })
            .eq("order_id", orderId)
            .select("id");

        if (erreurMaj) {
            console.error("[Driver API] tracking error:", erreurMaj);
            return c.json({ error: "Position non enregistrée" }, 500);
        }

        // Rien à mettre à jour : la ligne de suivi n'existe pas encore. C'est le
        // cas normal de la première position d'une course, et c'était le trou —
        // un UPDATE sans ligne cible ne renvoie pas d'erreur, la route répondait
        // donc « enregistré » alors que rien ne l'était, et la carte du client
        // restait vide toute la livraison. Côté web, seul le PUT de démarrage de
        // session créait cette ligne ; l'app mobile n'a pas d'équivalent, donc la
        // route se charge elle-même de l'ouvrir.
        if (!misAJour?.length) {
            const { data: profil } = await db
                .from("users")
                .select("full_name, email")
                .eq("id", userId)
                .maybeSingle();

            // `upsert` plutôt qu'`insert` : deux positions envoyées coup sur coup
            // arriveraient toutes deux ici, et la seconde violerait la contrainte
            // d'unicité sur `order_id`. Le conflit se résout en mise à jour.
            const { error: erreurCreation } = await db
                .from("delivery_tracking")
                .upsert(
                    {
                        order_id: orderId,
                        restaurant_id: (order as any).restaurant_id,
                        client_address: (order as any).delivery_address ?? null,
                        deliverer_name:
                            (profil as any)?.full_name ?? (profil as any)?.email ?? "Livreur",
                        deliverer_lat: lat,
                        deliverer_lng: lng,
                        status: "active",
                        started_at: maintenant,
                        updated_at: maintenant,
                    },
                    { onConflict: "order_id" },
                );

            if (erreurCreation) {
                console.error("[Driver API] tracking session error:", erreurCreation);
                return c.json({ error: "Position non enregistrée" }, 500);
            }
        }

        return c.json({ success: true });
    } catch (error) {
        console.error("[Driver API] tracking error:", error);
        return c.json({ error: "Erreur serveur" }, 500);
    }
});

export const driverRoutes = router;
