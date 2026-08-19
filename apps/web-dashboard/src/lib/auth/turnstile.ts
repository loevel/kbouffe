/**
 * Vérification serveur du jeton Turnstile.
 *
 * Les formulaires d'inscription affichaient le widget et refusaient d'envoyer
 * sans jeton, mais ce jeton n'était vérifié nulle part : ni transmis à Supabase,
 * ni soumis à /api/verify-turnstile. Le contrôle ne coûtait donc rien à un robot
 * qui appelle l'API directement.
 *
 * `verifierTurnstile` réclame au serveur la validation du jeton. Elle renvoie
 * `true` quand aucune clé publique n'est configurée (environnements de dev sans
 * Turnstile) et quand le backend répond que la clé secrète est absente — le
 * comportement de repli existant, explicite plutôt que subi.
 */
export async function verifierTurnstile(token: string | null): Promise<boolean> {
    if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return true;
    if (!token) return false;

    try {
        const res = await fetch("/api/verify-turnstile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as { success?: boolean };
        return data.success === true;
    } catch {
        return false;
    }
}
