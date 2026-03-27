import type { Metadata } from "next";
import { CartPageClient } from "./_cart-client";

export const metadata: Metadata = {
    title: "Mon panier — Kbouffe",
    description: "Vérifiez votre panier avant de passer votre commande.",
};

export default function CartPage() {
    return <CartPageClient />;
}
