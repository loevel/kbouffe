import { Suspense } from "react";
import { SpecializedLoginForm } from "@/components/auth/SpecializedLoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Espace Client — Kbouffe",
    description: "Connectez-vous à votre compte client Kbouffe pour commander vos repas préférés.",
};

export default function ClientLoginPage() {
    // Suspense requis : le formulaire lit ?redirectTo via useSearchParams.
    return (
        <Suspense fallback={null}>
            <SpecializedLoginForm type="client" />
        </Suspense>
    );
}
