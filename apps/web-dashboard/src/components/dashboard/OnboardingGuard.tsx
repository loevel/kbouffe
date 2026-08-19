"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDashboard } from "@kbouffe/module-core/ui";

/**
 * OnboardingGuard
 *
 * Le rôle « merchant » est posé dans les métadonnées dès l'inscription, donc
 * avant que le restaurant existe. Le middleware envoie ensuite tout merchant
 * vers /dashboard, jamais vers /onboarding, et l'API répond 404 tant qu'aucun
 * restaurant n'est rattaché au compte. Un restaurateur dont l'inscription s'est
 * interrompue voyait donc un tableau de bord complet dont chaque panneau
 * échouait en silence, sans une ligne pour lui dire quoi faire ni un lien pour
 * reprendre. On le ramène là où il peut terminer.
 *
 * Le renvoi n'a lieu qu'une fois le chargement terminé : pendant celui-ci,
 * restaurant vaut null sans que cela signifie quoi que ce soit.
 */
export function OnboardingGuard() {
    const { restaurant, loading, user } = useDashboard();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (loading) return;
        if (!user) return; // le middleware s'occupe déjà des non-connectés
        if (restaurant) return;
        if (pathname.startsWith("/dashboard/fournisseur")) return; // espace fournisseur

        router.replace("/onboarding");
    }, [loading, user, restaurant, pathname, router]);

    return null;
}
