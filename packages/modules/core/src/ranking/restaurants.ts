/**
 * Ordonnancement des restaurants de la vitrine.
 *
 * Partagé par `/api/stores` (vitrine web) et `/stores` (API Hono, servie à
 * l'app mobile) : les deux doivent classer pareil, sinon le même tri donne
 * deux listes différentes selon le client.
 *
 * Deux choses en découlent, et elles doivent rester cohérentes :
 * `colonnesDeTri()` donne l'ordre appliqué en base, `comparerRestaurants()`
 * l'ordre final appliqué à la page. Si les deux divergent, le `.limit()` de la
 * requête tronque sur un critère et l'affichage classe sur un autre — on perd
 * alors des restaurants qui auraient dû figurer dans la liste.
 */

export type OrdreRestaurants = "recommended" | "rating" | "orders" | "newest";

/** Les champs dont le classement a besoin. Volontairement minimal. */
export interface RestaurantClassable {
    name?: string | null;
    rating?: number | null;
    review_count?: number | null;
    order_count?: number | null;
    created_at?: string | null;
    is_sponsored?: boolean | null;
    is_premium?: boolean | null;
}

/**
 * Prior bayésien : une note moyenne plausible, et le nombre d'avis à partir
 * duquel la note d'un restaurant pèse autant que ce prior.
 *
 * Sans lui, un restaurant à 5,0 sur un seul avis coiffe un restaurant à 4,7
 * sur deux cents. Un avis n'est pas une réputation.
 */
const NOTE_A_PRIORI = 4.0;
const POIDS_A_PRIORI = 5;

/**
 * Note pondérée par le volume d'avis (estimation bayésienne).
 *
 * Sert uniquement à classer : la note affichée au client reste la moyenne
 * brute, celle que les avis disent réellement.
 */
export function notePonderee(note?: number | null, nbAvis?: number | null): number {
    const v = Math.max(0, nbAvis ?? 0);
    const R = note ?? 0;
    if (v === 0) return 0;
    return (v / (v + POIDS_A_PRIORI)) * R + (POIDS_A_PRIORI / (v + POIDS_A_PRIORI)) * NOTE_A_PRIORI;
}

/** Un restaurant est noté s'il a au moins un avis, pas s'il a une note non nulle. */
function estNote(r: RestaurantClassable): boolean {
    return (r.review_count ?? 0) > 0;
}

/** Compare deux chaînes en français, à casse et accents près, `null` en dernier. */
function parNom(a?: string | null, b?: string | null): number {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b, "fr", { sensitivity: "base" });
}

function parDate(a?: string | null, b?: string | null): number {
    const ta = a ? Date.parse(a) : NaN;
    const tb = b ? Date.parse(b) : NaN;
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return tb - ta;
}

/**
 * Classement par note.
 *
 * Les restaurants sans aucun avis passent après tous les notés, quel que soit
 * leur score : « Mieux notés » doit répondre sur ceux qu'on a notés. Les
 * placer selon le prior bayésien les ferait passer devant un restaurant
 * réellement mal noté, ce qui est défendable en théorie et déroutant en
 * pratique. Entre eux, l'ordre alphabétique — il n'y a aucun signal à
 * exploiter, autant que ce soit stable et explicable plutôt qu'arbitraire.
 */
function parNote(a: RestaurantClassable, b: RestaurantClassable): number {
    const aNote = estNote(a);
    const bNote = estNote(b);
    if (aNote !== bNote) return aNote ? -1 : 1;
    if (!aNote) return parNom(a.name, b.name);

    const ecart = notePonderee(b.rating, b.review_count) - notePonderee(a.rating, a.review_count);
    if (Math.abs(ecart) > 1e-9) return ecart;

    const parAvis = (b.review_count ?? 0) - (a.review_count ?? 0);
    if (parAvis !== 0) return parAvis;
    return parNom(a.name, b.name);
}

/**
 * Comparateur final, appliqué à la page renvoyée par la base.
 *
 * Chaque mode se termine par le nom : sans départage explicite, les ex æquo
 * sortent dans l'ordre où la base les a rendus, qui n'est pas garanti d'une
 * requête à l'autre. Sur ce catalogue, 91 restaurants sur 93 n'ont aucun avis
 * et aucune commande — sans ce départage, la liste change à chaque appel.
 */
export function comparerRestaurants(
    ordre: OrdreRestaurants,
): (a: RestaurantClassable, b: RestaurantClassable) => number {
    switch (ordre) {
        case "rating":
            return parNote;

        case "orders":
            return (a, b) => {
                const ecart = (b.order_count ?? 0) - (a.order_count ?? 0);
                if (ecart !== 0) return ecart;
                const note = parNote(a, b);
                return note !== 0 ? note : parNom(a.name, b.name);
            };

        case "newest":
            return (a, b) => {
                const ecart = parDate(a.created_at, b.created_at);
                return ecart !== 0 ? ecart : parNom(a.name, b.name);
            };

        case "recommended":
        default:
            return (a, b) => {
                const sponsor = Number(!!b.is_sponsored) - Number(!!a.is_sponsored);
                if (sponsor !== 0) return sponsor;
                const premium = Number(!!b.is_premium) - Number(!!a.is_premium);
                if (premium !== 0) return premium;
                return parNote(a, b);
            };
    }
}

/**
 * Ordre à appliquer en base, aligné sur `comparerRestaurants`.
 *
 * PostgREST ne sait pas trier sur une expression, donc la note pondérée n'est
 * pas exprimable ici : on approche avec `rating` puis `review_count`, ce qui
 * suffit à ce que le `.limit()` retienne les bons restaurants. Le classement
 * exact est ensuite appliqué à la page.
 *
 * Le jour où le catalogue dépassera la fenêtre de récupération, il faudra
 * remonter la note pondérée en base — vue matérialisée ou RPC — pour que la
 * troncature reste juste.
 */
export function colonnesDeTri(
    ordre: OrdreRestaurants,
): { colonne: string; ascendant: boolean }[] {
    const departage = [{ colonne: "name", ascendant: true }, { colonne: "id", ascendant: true }];

    switch (ordre) {
        case "rating":
            return [
                { colonne: "rating", ascendant: false },
                { colonne: "review_count", ascendant: false },
                ...departage,
            ];
        case "orders":
            return [
                { colonne: "order_count", ascendant: false },
                { colonne: "rating", ascendant: false },
                ...departage,
            ];
        case "newest":
            return [{ colonne: "created_at", ascendant: false }, ...departage];
        case "recommended":
        default:
            return [
                { colonne: "is_sponsored", ascendant: false },
                { colonne: "is_premium", ascendant: false },
                { colonne: "rating", ascendant: false },
                { colonne: "review_count", ascendant: false },
                ...departage,
            ];
    }
}

/** Normalise le paramètre `?sort` en un mode connu. */
export function ordreDemande(brut?: string | null): OrdreRestaurants {
    return brut === "rating" || brut === "orders" || brut === "newest" ? brut : "recommended";
}
