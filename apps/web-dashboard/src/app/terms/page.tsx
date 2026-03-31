import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Conditions Générales d'Utilisation — Kbouffe",
    description: "Consultez les conditions générales d'utilisation de la plateforme Kbouffe.",
};

export default function TermsPage() {
    return (
        <div className="flex min-h-screen flex-col bg-surface-50 dark:bg-surface-950 font-sans">
            <Navbar />
            <main className="flex-1 pt-28 pb-16">
                <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                    <h1 className="text-4xl font-bold text-surface-900 dark:text-white mb-8">
                        Conditions Générales d&apos;Utilisation
                    </h1>
                    <p className="text-surface-500 dark:text-surface-400 mb-12">
                        Dernière mise à jour : Février 2026
                    </p>

                    <div className="prose dark:prose-invert max-w-none space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">1. Objet</h2>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                                Les présentes Conditions Générales d&apos;Utilisation (ci-après &quot;CGU&quot;) ont pour objet de définir
                                les conditions d&apos;accès et d&apos;utilisation de la plateforme Kbouffe, accessible via le site web
                                kbouffe.com et les applications mobiles associées. En utilisant la plateforme, vous acceptez
                                sans réserve les présentes CGU.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">2. Définitions</h2>
                            <ul className="space-y-3 text-surface-600 dark:text-surface-400 leading-relaxed">
                                <li><strong className="text-surface-900 dark:text-white">Plateforme :</strong> Le site web kbouffe.com et les applications mobiles Kbouffe.</li>
                                <li><strong className="text-surface-900 dark:text-white">Restaurateur :</strong> Toute personne physique ou morale inscrite en tant que vendeur sur la plateforme.</li>
                                <li><strong className="text-surface-900 dark:text-white">Client :</strong> Toute personne qui passe commande via la plateforme.</li>
                                <li><strong className="text-surface-900 dark:text-white">Services :</strong> L&apos;ensemble des fonctionnalités proposées par Kbouffe.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">3. Inscription</h2>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                                L&apos;inscription sur la plateforme est gratuite. Elle nécessite la fourniture d&apos;informations
                                exactes et à jour, notamment : nom, prénom, adresse e-mail, numéro de téléphone, et pour
                                les restaurateurs, le nom et l&apos;adresse de l&apos;établissement. Vous êtes responsable de la
                                confidentialité de vos identifiants de connexion.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">4. Services proposés</h2>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                                Kbouffe met à disposition des restaurateurs un outil de création de boutique en ligne
                                leur permettant de publier leur menu, recevoir des commandes et encaisser des paiements
                                via Mobile Money (MTN MoMo, Orange Money). Les clients peuvent parcourir les restaurants,
                                consulter les menus et passer commande.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">5. Tarification</h2>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                                Kbouffe applique un modèle de tarification par abonnement sans commission sur les ventes.
                                Les détails des plans et tarifs sont disponibles sur la page Tarifs. Kbouffe se réserve le
                                droit de modifier ses tarifs avec un préavis de 30 jours.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">6. Responsabilités</h2>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                                Kbouffe agit en tant qu&apos;intermédiaire technique. La qualité des plats, le respect des
                                délais de préparation et la conformité sanitaire relèvent de la responsabilité exclusive
                                du restaurateur. Kbouffe ne pourra être tenu responsable des litiges entre restaurateurs
                                et clients concernant la qualité des produits ou services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">7. Propriété intellectuelle</h2>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                                L&apos;ensemble des éléments de la plateforme (logos, textes, interface, code source) sont la
                                propriété exclusive de Kbouffe. Toute reproduction, même partielle, est interdite sans
                                autorisation préalable. Les restaurateurs conservent la propriété de leur contenu
                                (photos, descriptions, prix).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">8. Contact</h2>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                                Pour toute question relative aux présentes CGU, vous pouvez nous contacter via la
                                page de contact de notre site ou par e-mail à contact@kbouffe.com.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
