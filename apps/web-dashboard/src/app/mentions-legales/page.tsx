import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Mentions Légales — KBouffe",
    description: "Mentions légales de la plateforme KBouffe — éditeur, hébergement, propriété intellectuelle.",
};

// ── Identité légale de l'éditeur ─────────────────────────────────────────────
// Mettre à jour ces constantes dès l'immatriculation de la société.
const EDITOR = {
    raisonSociale:  process.env.NEXT_PUBLIC_KBOUFFE_RAISON_SOCIALE    ?? "KBouffe",
    formeJuridique: process.env.NEXT_PUBLIC_KBOUFFE_FORME_JURIDIQUE   ?? "[À compléter — ex. SARL]",
    capital:        process.env.NEXT_PUBLIC_KBOUFFE_CAPITAL            ?? "[À compléter — ex. 1 000 000 FCFA]",
    siege:          process.env.NEXT_PUBLIC_KBOUFFE_SIEGE              ?? "[À compléter — ex. Douala, Cameroun]",
    rccm:           process.env.NEXT_PUBLIC_KBOUFFE_RCCM               ?? "[À compléter — ex. RC/DLA/2025/B/XXXX]",
    niu:            process.env.NEXT_PUBLIC_KBOUFFE_NIU                ?? "[À compléter]",
    directeur:      process.env.NEXT_PUBLIC_KBOUFFE_DIRECTEUR_PUB     ?? "[À compléter — Directeur de Publication]",
    email:          "privacy@kbouffe.com",
    site:           "https://kbouffe.com",
};

export default function MentionsLegalesPage() {
    return (
        <div className="flex min-h-screen flex-col bg-surface-50 dark:bg-surface-950 font-sans">
            <Navbar />
            <main className="flex-1 pt-28 pb-16">
                <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                    <h1 className="text-4xl font-bold text-surface-900 dark:text-white mb-8">
                        Mentions Légales
                    </h1>
                    <p className="text-surface-500 dark:text-surface-400 mb-12 text-sm">
                        Conformément à la loi camerounaise n° 2010/012 relative à la cybersécurité
                        et à la cybercriminalité, et à la loi n° 2010/013 régissant les communications
                        électroniques au Cameroun.
                    </p>

                    <div className="space-y-10">

                        {/* ── 1. Éditeur ── */}
                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
                                1. Éditeur de la plateforme
                            </h2>
                            <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800/50 p-5 space-y-2 text-sm text-surface-700 dark:text-surface-300">
                                <Row label="Raison sociale"       value={EDITOR.raisonSociale} />
                                <Row label="Forme juridique"      value={EDITOR.formeJuridique} />
                                <Row label="Capital social"       value={EDITOR.capital} />
                                <Row label="Siège social"         value={EDITOR.siege} />
                                <Row label="RCCM"                 value={EDITOR.rccm} />
                                <Row label="NIU"                  value={EDITOR.niu} />
                                <Row label="Directeur de publication" value={EDITOR.directeur} />
                                <Row label="Site web"             value={EDITOR.site} />
                                <Row label="Contact"              value={EDITOR.email} />
                            </div>
                        </section>

                        {/* ── 2. Hébergeur ── */}
                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
                                2. Hébergement
                            </h2>
                            <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800/50 p-5 space-y-2 text-sm text-surface-700 dark:text-surface-300">
                                <Row label="Hébergeur web"        value="Cloudflare, Inc." />
                                <Row label="Adresse"              value="101 Townsend St, San Francisco, CA 94107, États-Unis" />
                                <Row label="Site web"             value="https://www.cloudflare.com" />
                                <Row label="Base de données"      value="Supabase, Inc. — San Francisco, États-Unis (supabase.com)" />
                            </div>
                        </section>

                        {/* ── 3. Propriété intellectuelle ── */}
                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
                                3. Propriété intellectuelle
                            </h2>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed mb-3">
                                L'ensemble des éléments constituant la plateforme KBouffe (textes, graphismes,
                                logiciels, images, vidéos, sons, plans, noms, logos, marques, créations et œuvres
                                protégeables) est la propriété exclusive de {EDITOR.raisonSociale} ou de ses partenaires.
                            </p>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                                Toute reproduction, représentation, modification, publication, adaptation ou exploitation,
                                totale ou partielle, de ces éléments, quel que soit le moyen ou le procédé utilisé,
                                est interdite sans l'autorisation écrite préalable de {EDITOR.raisonSociale}.
                                Toute exploitation non autorisée constitue une contrefaçon sanctionnée par le droit camerounais.
                            </p>
                        </section>

                        {/* ── 4. Données personnelles ── */}
                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
                                4. Données personnelles
                            </h2>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                                La collecte et le traitement de données personnelles sont régis par notre{" "}
                                <a href="/privacy" className="text-brand-500 hover:underline font-medium">
                                    Politique de Confidentialité
                                </a>
                                , conformément à la loi camerounaise n° 2010/012 du 21 décembre 2010 relative
                                à la cybersécurité et à la cybercriminalité.
                            </p>
                        </section>

                        {/* ── 5. Responsabilité ── */}
                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
                                5. Limitation de responsabilité
                            </h2>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed mb-3">
                                {EDITOR.raisonSociale} s'efforce d'assurer l'exactitude et la mise à jour des informations
                                diffusées sur la plateforme, et se réserve le droit d'en corriger le contenu à tout moment
                                et sans préavis. Toutefois, {EDITOR.raisonSociale} ne peut garantir l'exhaustivité,
                                l'exactitude ni l'actualité des informations publiées.
                            </p>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                                {EDITOR.raisonSociale} ne saurait être tenu responsable des dommages directs ou indirects
                                résultant de l'utilisation de la plateforme ou de l'impossibilité d'y accéder.
                            </p>
                        </section>

                        {/* ── 6. Contact ── */}
                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
                                6. Contact
                            </h2>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                                Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter
                                à l'adresse :{" "}
                                <a href={`mailto:${EDITOR.email}`} className="text-brand-500 hover:underline font-medium">
                                    {EDITOR.email}
                                </a>
                            </p>
                        </section>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <p>
            <span className="font-medium text-surface-900 dark:text-white">{label} :</span>{" "}
            {value}
        </p>
    );
}
