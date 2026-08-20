/**
 * Normalisation et échappement des termes de recherche.
 *
 * `normaliserRecherche` doit rester le pendant exact de la fonction SQL
 * `public.sans_accents(text)` : les colonnes `recherche_normalisee` de
 * `restaurants` et `products` sont générées avec elle, et une requête
 * normalisée autrement ne trouverait rien.
 *
 * Les règles sont : minuscules, suppression des accents et des ligatures. Le
 * `trim` final n'existe que de ce côté-ci : il nettoie la saisie, alors que la
 * colonne concatène plusieurs champs et garde ses espaces internes.
 * `normalize("NFD")` décompose « é » en « e » suivi d'un accent combinant, que
 * la classe Unicode `\p{Diacritic}` retire ensuite.
 */
export function normaliserRecherche(terme: string): string {
    return terme
        .replace(/œ/g, "oe")
        .replace(/Œ/g, "OE")
        .replace(/æ/g, "ae")
        .replace(/Æ/g, "AE")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim();
}

/**
 * Échappe un terme pour la grammaire de filtre PostgREST.
 *
 * La virgule sépare les conditions d'un `.or()`, les parenthèses délimitent les
 * groupes, `%` et `_` sont les jokers de `LIKE` : interpolés bruts, ils
 * cassent la requête ou en détournent la portée. On échappe plutôt que de
 * supprimer, pour qu'une recherche sur « 50% » trouve bien « 50% ».
 *
 * Même logique que `escapeIlike` dans apps/api/src/lib/search.ts.
 */
export function echapperPourFiltre(terme: string): string {
    return terme
        .replace(/\\/g, "\\\\") // l'antislash d'abord
        .replace(/,/g, "\\,")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_");
}

/**
 * Terme prêt à être comparé à une colonne `recherche_normalisee`.
 *
 * La longueur est bornée : une chaîne de recherche démesurée fait travailler
 * l'index trigramme pour rien.
 */
export function termeDeRecherche(brut: string | null | undefined, longueurMax = 100): string {
    if (!brut) return "";
    return echapperPourFiltre(normaliserRecherche(brut).slice(0, longueurMax));
}
