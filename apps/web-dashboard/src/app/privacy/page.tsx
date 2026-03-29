import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Politique de Confidentialité — Kbouffe",
    description: "Découvrez comment Kbouffe collecte, utilise et protège vos données personnelles.",
};

export default function PrivacyPage() {
    return (
        <div className="flex min-h-screen flex-col bg-surface-50 dark:bg-surface-950 font-sans">
            <Navbar />
            <main className="flex-1 pt-28 pb-16">
                <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                    <h1 className="text-4xl font-bold text-surface-900 dark:text-white mb-8">
                        Politique de Confidentialité
                    </h1>
                    <p className="text-surface-500 dark:text-surface-400 mb-12">
                        Dernière mise à jour : Février 2026
                    </p>

                    <div className="prose dark:prose-invert max-w-none space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">1. Introduction</h2>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                                Kbouffe s&apos;engage à protéger la vie privée de ses utilisateurs. La présente
                                politique de confidentialité décrit les types de données personnelles que nous collectons,
                                comment nous les utilisons et les mesures prises pour les protéger, conformément à la
                                <strong className="text-surface-900 dark:text-white"> Loi n°2010/012 du 21 décembre 2010</strong> relative
                                à la cybersécurité et à la cybercriminalité au Cameroun, et aux directives de l&apos;
                                <strong className="text-surface-900 dark:text-white">Agence Nationale des Technologies de l&apos;Information et de la Communication (ANTIC)</strong>.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">2. Données collectées</h2>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed mb-3">
                                Nous collectons les types de données suivants :
                            </p>
                            <ul className="space-y-3 text-surface-600 dark:text-surface-400 leading-relaxed">
                                <li><strong className="text-surface-900 dark:text-white">Données d&apos;identification :</strong> nom, prénom, adresse e-mail, numéro de téléphone.</li>
                                <li><strong className="text-surface-900 dark:text-white">Données de restaurant :</strong> nom de l&apos;établissement, adresse, description, photos des plats.</li>
                                <li><strong className="text-surface-900 dark:text-white">Données de commande :</strong> historique des commandes, montants, adresses de livraison.</li>
                                <li><strong className="text-surface-900 dark:text-white">Données techniques :</strong> adresse IP, type de navigateur, pages visitées, durée de visite.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">3. Durées de conservation</h2>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed mb-4">
                                Nous conservons vos données personnelles uniquement le temps nécessaire aux finalités
                                pour lesquelles elles ont été collectées, et au respect de nos obligations légales.
                            </p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
                                    <thead className="bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Catégorie de données</th>
                                            <th className="px-4 py-3 font-semibold">Durée de conservation</th>
                                            <th className="px-4 py-3 font-semibold">Base légale</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                                        <tr>
                                            <td className="px-4 py-3">Données de compte (profil, identifiants)</td>
                                            <td className="px-4 py-3">Durée de la relation + 30 jours après suppression</td>
                                            <td className="px-4 py-3">Exécution du contrat</td>
                                        </tr>
                                        <tr className="bg-surface-50 dark:bg-surface-900/50">
                                            <td className="px-4 py-3">Commandes et factures</td>
                                            <td className="px-4 py-3 font-medium text-surface-900 dark:text-white">10 ans</td>
                                            <td className="px-4 py-3">Obligation fiscale — CGI camerounais</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3">Références de transactions de paiement</td>
                                            <td className="px-4 py-3 font-medium text-surface-900 dark:text-white">10 ans</td>
                                            <td className="px-4 py-3">Obligation fiscale — CGI camerounais</td>
                                        </tr>
                                        <tr className="bg-surface-50 dark:bg-surface-900/50">
                                            <td className="px-4 py-3">Logs techniques (IP, navigation)</td>
                                            <td className="px-4 py-3">12 mois</td>
                                            <td className="px-4 py-3">Intérêt légitime (sécurité)</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3">Communications marketing (SMS, notifications)</td>
                                            <td className="px-4 py-3">Jusqu'au retrait du consentement</td>
                                            <td className="px-4 py-3">Consentement</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-surface-500 dark:text-surface-400 text-sm mt-4">
                                À l&apos;expiration de ces délais, vos données sont supprimées ou anonymisées de manière irréversible.
                                Pour les données soumises à obligation légale de conservation, elles sont conservées à titre d&apos;archive
                                et ne sont plus utilisées à des fins commerciales.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">4. Utilisation des données</h2>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed mb-3">
                                Vos données sont utilisées pour :
                            </p>
                            <ul className="space-y-3 text-surface-600 dark:text-surface-400 leading-relaxed">
                                <li>Permettre la création et la gestion de votre compte.</li>
                                <li>Traiter et suivre vos commandes.</li>
                                <li>Faciliter les paiements via Mobile Money.</li>
                                <li>Améliorer nos services et votre expérience utilisateur.</li>
                                <li>Vous envoyer des notifications relatives à vos commandes.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">5. Partage des données</h2>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                                Vos données personnelles ne sont jamais vendues à des tiers. Elles peuvent être partagées
                                avec les restaurateurs (dans le cadre du traitement de vos commandes) et avec nos
                                prestataires de paiement (MTN MoMo, Orange Money) dans la stricte mesure nécessaire
                                à l&apos;exécution des transactions.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">6. Sécurité</h2>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                                Nous mettons en oeuvre des mesures techniques et organisationnelles appropriées
                                pour protéger vos données contre tout accès non autorisé, modification, divulgation
                                ou destruction. Les connexions sont chiffrées via le protocole HTTPS et les données
                                sensibles sont stockées de manière sécurisée.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">7. Vos droits</h2>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed mb-3">
                                Conformément à la <strong className="text-surface-900 dark:text-white">Loi n°2010/012 Art.48</strong>, vous disposez des droits suivants :
                            </p>
                            <ul className="space-y-3 text-surface-600 dark:text-surface-400 leading-relaxed">
                                <li><strong className="text-surface-900 dark:text-white">Droit d&apos;accès :</strong> obtenir une copie de vos données personnelles.</li>
                                <li><strong className="text-surface-900 dark:text-white">Droit de rectification :</strong> corriger des données inexactes.</li>
                                <li><strong className="text-surface-900 dark:text-white">Droit de suppression :</strong> demander la suppression de vos données.</li>
                                <li><strong className="text-surface-900 dark:text-white">Droit d&apos;opposition :</strong> vous opposer au traitement de vos données.</li>
                            </ul>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed mt-4">
                                Pour tout exercice de vos droits ou réclamation relative à la protection de vos données
                                personnelles, vous pouvez également saisir l&apos;
                                <strong className="text-surface-900 dark:text-white">ANTIC</strong> (Agence Nationale des Technologies de l&apos;Information et de la Communication) :
                                {" "}<a href="https://antic.cm" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">https://antic.cm</a>.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">8. Cookies</h2>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                                Notre plateforme utilise des cookies essentiels au fonctionnement du service
                                (authentification, préférences). Aucun cookie publicitaire n&apos;est utilisé.
                                Vous pouvez configurer votre navigateur pour refuser les cookies, bien que cela
                                puisse limiter certaines fonctionnalités.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">9. Contact</h2>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                                Pour exercer vos droits ou pour toute question relative à la protection de vos données,
                                contactez-nous à l&apos;adresse privacy@kbouffe.com ou via notre page de contact.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
