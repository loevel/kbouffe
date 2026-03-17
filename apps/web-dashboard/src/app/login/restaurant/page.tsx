import { SpecializedLoginForm } from "@/components/auth/SpecializedLoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Espace Restaurant — Kbouffe",
    description: "Connectez-vous à votre espace restaurateur Kbouffe pour gérer votre établissement.",
};

export default function RestaurantLoginPage() {
    return <SpecializedLoginForm type="restaurant" />;
}
