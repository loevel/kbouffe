import { Suspense } from "react";
import { SpecializedLoginForm } from "@/components/auth/SpecializedLoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Espace Fournisseur — Kbouffe",
    description: "Connectez-vous à votre espace fournisseur / agriculteur Kbouffe.",
};

export default function FournisseurLoginPage() {
    // Suspense requis : le formulaire lit ?redirectTo via useSearchParams.
    return (
        <Suspense fallback={null}>
            <SpecializedLoginForm type="supplier" />
        </Suspense>
    );
}
