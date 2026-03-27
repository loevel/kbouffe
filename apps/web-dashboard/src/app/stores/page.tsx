import { ClientSectionPage } from "@/components/store/ClientSectionPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Explorer les restaurants — Kbouffe",
    description: "Découvrez les meilleurs restaurants camerounais et commandez vos plats préférés en ligne.",
};

export default function ExplorePage() {
    return <ClientSectionPage section="restaurants" />;
}
