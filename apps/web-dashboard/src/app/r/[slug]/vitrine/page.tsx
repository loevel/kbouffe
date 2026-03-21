import type { Metadata } from "next";
import { ShowcasePageClient } from "./showcase-client";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const formattedName = slug
        .replace(/-/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());

    return {
        title: `${formattedName} — Vitrine | Kbouffe`,
        description: `Découvrez ${formattedName} sur Kbouffe — menu, avis clients, horaires et plus encore.`,
        openGraph: {
            title: `${formattedName} — Kbouffe`,
            description: `Découvrez ${formattedName} sur Kbouffe`,
        },
    };
}

export default async function ShowcasePage({ params }: Props) {
    const { slug } = await params;
    return <ShowcasePageClient slug={slug} />;
}
