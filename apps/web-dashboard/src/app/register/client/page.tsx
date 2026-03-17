import { ClientRegistrationForm } from "@/components/auth/ClientRegistrationForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Créer un compte — Kbouffe",
    description: "Inscrivez-vous gratuitement pour commander vos plats préférés.",
};

export default function ClientRegisterPage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 font-sans">
            <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
                <ClientRegistrationForm />
            </main>
        </div>
    );
}
