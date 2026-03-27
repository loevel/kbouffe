import { RestaurantOnboardingWizard } from "@/components/auth/RestaurantOnboardingWizard";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Créer mon restaurant — Kbouffe",
    description: "Inscrivez votre restaurant sur Kbouffe, développez votre activité et simplifiez vos commandes en ligne.",
};

export default function RestaurantRegisterPage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 font-sans">
            <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
                <RestaurantOnboardingWizard />
            </main>
        </div>
    );
}
