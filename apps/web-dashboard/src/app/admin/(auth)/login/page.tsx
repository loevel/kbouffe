import { AdminLoginForm } from "@/components/admin/auth/AdminLoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Connexion Admin — Kbouffe",
    description: "Espace de connexion sécurisé réservé aux administrateurs de la plateforme Kbouffe.",
};

export default function AdminLoginPage() {
    return <AdminLoginForm />;
}
