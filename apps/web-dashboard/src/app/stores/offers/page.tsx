import { OffersClient } from "./_offers-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Offres & Promotions — Kbouffe",
    description: "Découvrez les meilleures réductions du moment. Des plats à prix réduit livrés chez vous.",
};

export default function OffersPage() {
    return <OffersClient />;
}
