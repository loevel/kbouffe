import type { Metadata } from "next";
import { StorePageClient } from "./store-page-client";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    return {
        title: `${slug} — Kbouffe`,
        description: `Commandez en ligne chez ${slug} sur Kbouffe`,
        manifest: `/api/store/${slug}/manifest.json`,
    };
}

export default async function PublicStorePage({ params }: Props) {
    const { slug } = await params;
    return <StorePageClient slug={slug} />;
}
