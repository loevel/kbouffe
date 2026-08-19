import type { Metadata } from "next";
import { Suspense } from "react";
import { StorePageClient } from "./store-page-client";
import { SITE_URL } from "@/lib/seo/site";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    return {
        title: `${slug} — Kbouffe`,
        description: `Commandez en ligne chez ${slug} sur Kbouffe`,
        manifest: `/api/store/${slug}/manifest.json`,
        // Cette vitrine est servie sur deux URLs : kbouffe.com/r/<slug> et le
        // sous-domaine personnalisé <perso>.kbouffe.com (réécrit ici par le
        // proxy). Sans canonical, les moteurs voient deux pages identiques et
        // répartissent le référencement entre les deux.
        alternates: {
            canonical: `${SITE_URL}/r/${slug}`,
        },
    };
}

export default async function PublicStorePage({ params }: Props) {
    const { slug } = await params;
    return (
        <Suspense fallback={null}>
            <StorePageClient slug={slug} />
        </Suspense>
    );
}
