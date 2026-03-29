import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Conditions Générales d'Utilisation — Kbouffe",
    description: "Consultez les conditions générales d'utilisation de la plateforme Kbouffe.",
};

const H2 = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">{children}</h2>
);
const H3 = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-lg font-semibold text-surface-800 dark:text-surface-200 mb-3 mt-5">{children}</h3>
);
const P = ({ children }: { children: React.ReactNode }) => (
    <p className="text-surface-600 dark:text-surface-400 leading-relaxed mb-3">{children}</p>
);
const Li = ({ children }: { children: React.ReactNode }) => (
    <li className="text-surface-600 dark:text-surface-400 leading-relaxed">{children}</li>
);
const Strong = ({ children }: { children: React.ReactNode }) => (
    <strong className="text-surface-900 dark:text-white font-semibold">{children}</strong>
);
const Warning = ({ children }: { children: React.ReactNode }) => (
    <div className="my-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 text-amber-800 dark:text-amber-300 text-sm leading-relaxed">
        {children}
    </div>
);

export default function TermsPage() {
    return (
        <div className="flex min-h-screen flex-col bg-surface-50 dark:bg-surface-950 font-sans">
            <Navbar />
            <main className="flex-1 pt-28 pb-16">
                <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                    <h1 className="text-4xl font-bold text-surface-900 dark:text-white mb-8">
                        Conditions Générales d&apos;Utilisation
                    </h1>
                    <p className="text-surface-500 dark:text-surface-400 mb-2">
                        Dernière mise à jour : Mars 2026
                    </p>
                    <p className="text-surface-500 dark:text-surface-400 mb-12 text-sm">
                        Applicable à toutes les parties utilisant la plateforme Kbouffe (kbouffe.com et applications mobiles associées).
                        Droit applicable : République du Cameroun.
                    </p>

                    <div className="prose dark:prose-invert max-w-none space-y-10">

                        {/* ── 1. Objet ── */}
                        <section>
                            <H2>1. Objet et acceptation</H2>
                            <P>
                                Les présentes Conditions Générales d&apos;Utilisation (ci-après <Strong>&quot;CGU&quot;</Strong>) définissent
                                les droits et obligations de toute personne physique ou morale (ci-après <Strong>&quot;l&apos;Utilisateur&quot;</Strong>)
                                accédant à la plateforme Kbouffe, éditée par la société Kbouffe (ci-après <Strong>&quot;Kbouffe&quot;</Strong>).
                            </P>
                            <P>
                                En créant un compte ou en utilisant la plateforme, l&apos;Utilisateur reconnaît avoir lu,
                                compris et accepté sans réserve les présentes CGU. Si l&apos;Utilisateur n&apos;accepte pas ces
                                conditions, il doit cesser immédiatement d&apos;utiliser la plateforme.
                            </P>
                            <P>
                                Kbouffe se réserve le droit de modifier les présentes CGU à tout moment. Les modifications
                                prennent effet 15 jours après notification par e-mail ou affichage sur la plateforme.
                                L&apos;utilisation continue de la plateforme après ce délai vaut acceptation des nouvelles CGU.
                            </P>
                        </section>

                        {/* ── 2. Définitions ── */}
                        <section>
                            <H2>2. Définitions</H2>
                            <ul className="space-y-3 list-none pl-0">
                                <Li><Strong>Plateforme :</Strong> Le site web kbouffe.com, le tableau de bord marchand et les applications mobiles Kbouffe.</Li>
                                <Li><Strong>Restaurateur / Marchand :</Strong> Toute personne physique ou morale exploitant un établissement de restauration inscrit sur la plateforme.</Li>
                                <Li><Strong>Fournisseur / Agriculteur :</Strong> Tout producteur agricole ou fournisseur de denrées alimentaires inscrit sur la marketplace Kbouffe.</Li>
                                <Li><Strong>Client :</Strong> Toute personne passant commande via la plateforme auprès d&apos;un Restaurateur.</Li>
                                <Li><Strong>Livreur :</Strong> Tout prestataire indépendant effectuant des livraisons via la plateforme.</Li>
                                <Li><Strong>Services :</Strong> L&apos;ensemble des fonctionnalités SaaS proposées par Kbouffe (logiciel de caisse, gestion de commandes, marketplace B2B, module RH indicatif, module Capital).</Li>
                                <Li><Strong>RCCM :</Strong> Registre du Commerce et du Crédit Mobilier.</Li>
                                <Li><Strong>NC :</Strong> Numéro Contribuable délivré par la Direction Générale des Impôts (DGI) du Cameroun.</Li>
                                <Li><Strong>TVA :</Strong> Taxe sur la Valeur Ajoutée au taux de 19,25 % applicable au Cameroun (CGI Art. 125).</Li>
                                <Li><Strong>CNPS :</Strong> Caisse Nationale de Prévoyance Sociale du Cameroun.</Li>
                            </ul>
                        </section>

                        {/* ── 3. Statut de Kbouffe ── */}
                        <section>
                            <H2>3. Statut de Kbouffe — Intermédiaire technique</H2>
                            <P>
                                Kbouffe est un <Strong>fournisseur de logiciel SaaS (Software as a Service)</Strong> et un
                                <Strong> intermédiaire technique de mise en relation</Strong>. À ce titre :
                            </P>
                            <ul className="space-y-2 list-disc pl-6 mb-3">
                                <Li>Kbouffe <Strong>n&apos;est pas partie</Strong> aux contrats de vente conclus entre Restaurateurs et Clients.</Li>
                                <Li>Kbouffe <Strong>ne détient pas</Strong> les fonds des transactions. Les paiements s&apos;effectuent directement entre le Client et le Restaurateur via les opérateurs de Mobile Money (MTN MoMo, Orange Money).</Li>
                                <Li>Kbouffe <Strong>n&apos;est pas employeur</Strong> des Livreurs, Restaurateurs ou de leur personnel.</Li>
                                <Li>Kbouffe <Strong>n&apos;est pas propriétaire</Strong> des marchandises vendues sur la marketplace.</Li>
                                <Li>Kbouffe <Strong>n&apos;est pas un établissement de crédit ou de microfinance</Strong> au sens du Règlement COBAC. Le module Kbouffe Capital est un service de scoring et de mise en relation avec des établissements financiers partenaires agréés.</Li>
                            </ul>
                            <P>
                                Ce statut est conforme à la Loi n°2010/021 du 21 décembre 2010 régissant le commerce
                                électronique au Cameroun et au Règlement CEMAC/UMAC sur les systèmes de paiement.
                            </P>
                        </section>

                        {/* ── 4. Obligations légales des Restaurateurs ── */}
                        <section>
                            <H2>4. Obligations légales des Restaurateurs</H2>
                            <P>
                                En s&apos;inscrivant sur Kbouffe, le Restaurateur déclare sur l&apos;honneur et garantit à Kbouffe
                                qu&apos;il satisfait à l&apos;ensemble des obligations légales, réglementaires et administratives
                                applicables à son activité au Cameroun, notamment :
                            </P>

                            <H3>4.1 Obligations commerciales et fiscales</H3>
                            <ul className="space-y-2 list-disc pl-6 mb-3">
                                <Li>Être titulaire d&apos;un <Strong>Registre du Commerce et du Crédit Mobilier (RCCM)</Strong> en cours de validité délivré par le Tribunal de commerce compétent.</Li>
                                <Li>Posséder un <Strong>Numéro Contribuable (NC)</Strong> actif délivré par la Direction Générale des Impôts (DGI).</Li>
                                <Li>Effectuer ses <Strong>déclarations fiscales</Strong> périodiques (mensuelle, trimestrielle ou annuelle selon le régime fiscal applicable) et reverser les impôts et taxes dus à la DGI, notamment la TVA collectée au taux de 19,25 %.</Li>
                                <Li>Tenir une <Strong>comptabilité régulière</Strong> conformément au droit OHADA (Acte uniforme relatif au droit comptable et à l&apos;information financière).</Li>
                                <Li>Délivrer à ses clients des <Strong>factures ou reçus conformes</Strong> au CGI, mentionnant au minimum : le NC, le RCCM, la raison sociale, l&apos;adresse, le montant HT, la TVA et le TTC.</Li>
                            </ul>
                            <Warning>
                                ⚠️ <strong>Kbouffe n&apos;est pas responsable</strong> des obligations fiscales du Restaurateur. Les tickets générés par le logiciel de caisse Kbouffe sont des outils de gestion interne. Le Restaurateur est seul responsable de la conformité de sa facturation vis-à-vis de la DGI.
                            </Warning>

                            <H3>4.2 Obligations sanitaires et d&apos;hygiène</H3>
                            <ul className="space-y-2 list-disc pl-6 mb-3">
                                <Li>Être titulaire d&apos;une <Strong>autorisation sanitaire d&apos;ouverture</Strong> en cours de validité délivrée par la délégation régionale du Ministère de la Santé Publique (MINSANTÉ), conformément au Décret n°2010/0656/PM du 26 mars 2010.</Li>
                                <Li>Respecter les règles d&apos;hygiène alimentaire fixées par les textes du MINSANTÉ et du MINCOMMERCE applicables aux établissements de restauration.</Li>
                                <Li>Garantir que les aliments proposés sont <Strong>propres à la consommation humaine</Strong>, correctement conservés et préparés dans des conditions hygiéniques.</Li>
                                <Li>Assurer la <Strong>formation hygiène alimentaire</Strong> de son personnel conformément aux textes en vigueur.</Li>
                                <Li>Se soumettre à tout contrôle sanitaire diligenté par les autorités compétentes et en assumer seul les conséquences.</Li>
                            </ul>

                            <H3>4.3 Marques multiples et Dark Kitchens</H3>
                            <P>
                                Le Restaurateur exploitant plusieurs marques depuis un même espace de production (Dark Kitchen)
                                déclare et garantit que chacune de ces marques dispose de ses propres autorisations légales et
                                sanitaires. Kbouffe intervient uniquement comme logiciel de gestion et ne peut être tenu
                                responsable de la conformité des marques opérées.
                            </P>

                            <H3>4.4 Obligations sociales envers le personnel</H3>
                            <ul className="space-y-2 list-disc pl-6 mb-3">
                                <Li>Le Restaurateur est le <Strong>seul employeur légal</Strong> de son personnel, conformément au Code du Travail camerounais (Loi n°92/007 du 14 août 1992).</Li>
                                <Li>Il est seul responsable des <Strong>déclarations et cotisations CNPS</Strong> (taux employeur 11,2 % + salarié 5,25 %) pour l&apos;ensemble de ses salariés.</Li>
                                <Li>Les calculs de primes, pourboires et rapports de paie fournis par le module RH de Kbouffe sont <Strong>strictement indicatifs</Strong>. Ils ne constituent pas des bulletins de paie officiels et ne se substituent pas aux obligations légales du Restaurateur envers son personnel et la CNPS.</Li>
                                <Li>Le Restaurateur effectue lui-même les paiements de salaires, primes et pourboires via ses propres moyens.</Li>
                            </ul>
                        </section>

                        {/* ── 5. Obligations des Fournisseurs / Agriculteurs ── */}
                        <section>
                            <H2>5. Obligations des Fournisseurs et Agriculteurs</H2>
                            <P>
                                Tout fournisseur ou agriculteur inscrit sur la marketplace Kbouffe déclare et garantit :
                            </P>
                            <ul className="space-y-2 list-disc pl-6 mb-3">
                                <Li>Être titulaire de toutes les autorisations requises par le <Strong>MINADER</Strong> (Ministère de l&apos;Agriculture et du Développement Rural) pour la commercialisation de ses produits agricoles, conformément à la Loi n°2003/006 du 21 avril 2003 sur la sécurité sanitaire des aliments.</Li>
                                <Li>Que les produits proposés respectent les <Strong>normes phytosanitaires</Strong> et de sécurité alimentaire applicables au Cameroun.</Li>
                                <Li>Que les transactions commerciales (facturation, livraison) s&apos;effectuent <Strong>directement</Strong> entre le Fournisseur et le Restaurateur acheteur. Kbouffe est un hébergeur de catalogue et une plateforme de mise en relation, non un commerçant ou distributeur.</Li>
                                <Li>Assumer seul la responsabilité en cas de <Strong>marchandise avariée, retard de livraison ou litige commercial</Strong>. Kbouffe ne peut être tenu responsable de la qualité ou de la livraison des marchandises.</Li>
                            </ul>
                        </section>

                        {/* ── 6. Livreurs indépendants ── */}
                        <section>
                            <H2>6. Livreurs — Statut de prestataire indépendant</H2>
                            <P>
                                Les livreurs utilisant la plateforme Kbouffe interviennent en qualité de <Strong>prestataires
                                de services indépendants</Strong>. Il n&apos;existe aucun lien de subordination, contrat de travail
                                ni relation d&apos;emploi entre Kbouffe et les livreurs.
                            </P>
                            <ul className="space-y-2 list-disc pl-6 mb-3">
                                <Li>Le livreur est responsable de sa propre couverture sociale, de ses déclarations fiscales et de sa conformité aux règles de circulation routière.</Li>
                                <Li>Le contrat de livraison est conclu entre le <Strong>Restaurateur et le Livreur</Strong>. Kbouffe n&apos;est pas partie à ce contrat.</Li>
                                <Li>En cas d&apos;accident, de perte ou de dégradation de marchandises durant la livraison, la responsabilité incombe au Livreur, sauf convention contraire avec le Restaurateur.</Li>
                                <Li>Le livreur déclare ne pas être en situation de travail dissimulé et assumer ses obligations vis-à-vis de l&apos;administration fiscale et de la CNPS.</Li>
                            </ul>
                        </section>

                        {/* ── 7. Paiements ── */}
                        <section>
                            <H2>7. Paiements et flux financiers</H2>
                            <P>
                                Les paiements sur la plateforme Kbouffe s&apos;effectuent via les opérateurs de Mobile Money
                                (MTN MoMo, Orange Money) directement entre le Client et le Restaurateur.
                                <Strong> Kbouffe ne collecte pas, ne détient pas et ne transfère pas les fonds</Strong> des
                                transactions commerciales. Kbouffe n&apos;est pas un établissement de paiement au sens du
                                Règlement n°01/02/CEMAC/UMAC/COBAC.
                            </P>
                            <P>
                                Kbouffe perçoit une <Strong>redevance SaaS</Strong> (abonnement logiciel) auprès des Restaurateurs
                                et, le cas échéant, des <Strong>frais de plateforme</Strong> auprès des Fournisseurs pour l&apos;accès
                                à la marketplace. Ces redevances sont soumises à la TVA applicable.
                            </P>
                            <P>
                                Dans le cadre du module Kbouffe Capital, Kbouffe perçoit auprès des établissements
                                financiers partenaires une <Strong>commission de mise en relation</Strong> pour chaque dossier
                                de financement abouti. Cette commission est indépendante du montant du prêt accordé
                                et n&apos;est pas à la charge du Restaurateur.
                            </P>
                        </section>

                        {/* ── 8. Module Capital ── */}
                        <section>
                            <H2>8. Module Kbouffe Capital — Financement</H2>
                            <P>
                                Le module Kbouffe Capital est un service de <Strong>scoring financier et de mise en relation</Strong>
                                entre les Restaurateurs et des établissements financiers partenaires agréés par la COBAC
                                (Advans Cameroun, Express Union, BICEC, etc.). Kbouffe agit en qualité d&apos;<Strong>apporteur
                                d&apos;affaires</Strong>.
                            </P>
                            <ul className="space-y-2 list-disc pl-6 mb-3">
                                <Li>Le contrat de prêt est conclu <Strong>exclusivement entre le Restaurateur et l&apos;établissement financier</Strong>. Kbouffe n&apos;est pas partie au contrat de crédit.</Li>
                                <Li>Le score de crédit calculé par Kbouffe est <Strong>indicatif</Strong> et basé sur les données de la plateforme. Il ne constitue pas une garantie d&apos;obtention d&apos;un financement.</Li>
                                <Li>En soumettant une demande de financement, le Restaurateur consent explicitement à la <Strong>transmission de ses données financières agrégées</Strong> à l&apos;établissement partenaire sélectionné, dans le strict cadre de l&apos;instruction de sa demande.</Li>
                                <Li>Kbouffe ne porte aucun risque de défaut de paiement. En cas d&apos;impayé, le recouvrement relève exclusivement de l&apos;établissement financier prêteur.</Li>
                            </ul>
                        </section>

                        {/* ── 9. Données personnelles ── */}
                        <section>
                            <H2>9. Données personnelles et vie privée</H2>
                            <P>
                                La collecte et le traitement des données personnelles sont régis par la
                                Loi n°2010/012 du 21 décembre 2010 relative à la cybersécurité et à la cybercriminalité
                                au Cameroun. Kbouffe s&apos;engage à traiter les données personnelles dans le strict respect
                                de cette loi et de sa <a href="/privacy" className="text-brand-500 hover:underline">Politique de Confidentialité</a>.
                            </P>
                            <H3>9.1 Géolocalisation</H3>
                            <P>
                                La plateforme peut collecter des données de géolocalisation (position GPS des livreurs,
                                adresses de livraison des clients) à des fins de suivi de commande et d&apos;optimisation
                                logistique. Cette collecte s&apos;effectue uniquement avec le <Strong>consentement préalable
                                et explicite</Strong> de l&apos;Utilisateur, qui peut le retirer à tout moment depuis les
                                paramètres de l&apos;application.
                            </P>
                            <H3>9.2 Droits des utilisateurs</H3>
                            <P>
                                Tout Utilisateur dispose d&apos;un droit d&apos;accès, de rectification, d&apos;opposition et de
                                suppression de ses données personnelles. Ces droits s&apos;exercent par e-mail à
                                <Strong> privacy@kbouffe.com</Strong> ou via la page
                                <a href="/dashboard/settings/data" className="text-brand-500 hover:underline ml-1">Mes données</a>.
                            </P>
                        </section>

                        {/* ── 10. Services proposés ── */}
                        <section>
                            <H2>10. Description des services</H2>
                            <P>
                                Kbouffe propose les services suivants aux Restaurateurs inscrits :
                            </P>
                            <ul className="space-y-2 list-disc pl-6 mb-3">
                                <Li><Strong>Logiciel de caisse et gestion de commandes :</Strong> création de boutique en ligne, menu digital, prise de commandes, encaissement Mobile Money.</Li>
                                <Li><Strong>Tableau de bord analytique :</Strong> statistiques de ventes, produits les plus commandés, heures de pointe.</Li>
                                <Li><Strong>Marketplace B2B :</Strong> mise en relation avec des fournisseurs et agriculteurs locaux.</Li>
                                <Li><Strong>Module RH indicatif :</Strong> calcul indicatif des primes, pourboires et estimations CNPS/IRPP (voir Art. 4.4).</Li>
                                <Li><Strong>Module Capital :</Strong> scoring financier et mise en relation avec des établissements de crédit agréés (voir Art. 8).</Li>
                                <Li><Strong>Réservations :</Strong> gestion des tables et réservations en salle.</Li>
                                <Li><Strong>Marketing :</Strong> coupons de réduction, campagnes promotionnelles.</Li>
                            </ul>
                        </section>

                        {/* ── 11. Tarification ── */}
                        <section>
                            <H2>11. Tarification</H2>
                            <P>
                                Kbouffe applique un modèle de tarification par <Strong>abonnement mensuel ou annuel</Strong>,
                                sans commission sur les ventes. Les détails des plans et tarifs sont disponibles sur
                                la page Tarifs. Kbouffe se réserve le droit de modifier ses tarifs avec un préavis de
                                <Strong> 30 jours</Strong> par notification e-mail.
                            </P>
                            <P>
                                Les abonnements sont soumis à la TVA camerounaise de 19,25 %. Le prix affiché
                                indique clairement le montant TTC applicable.
                            </P>
                        </section>

                        {/* ── 12. Responsabilités ── */}
                        <section>
                            <H2>12. Limitation de responsabilité</H2>
                            <P>
                                Kbouffe met tout en œuvre pour assurer la disponibilité et la fiabilité de la plateforme,
                                mais ne peut garantir une disponibilité ininterrompue. La responsabilité de Kbouffe
                                est limitée aux seuls dommages directs prouvés et ne peut excéder les sommes
                                effectivement versées par l&apos;Utilisateur au cours des 12 derniers mois.
                            </P>
                            <P>
                                Kbouffe ne peut être tenu responsable :
                            </P>
                            <ul className="space-y-2 list-disc pl-6 mb-3">
                                <Li>De la qualité, de la conformité sanitaire ou de la légalité des produits vendus par les Restaurateurs et Fournisseurs.</Li>
                                <Li>Du non-respect par les Restaurateurs de leurs obligations fiscales (TVA, IS, NC), sociales (CNPS) ou sanitaires.</Li>
                                <Li>Des litiges entre Restaurateurs, Clients, Fournisseurs et Livreurs.</Li>
                                <Li>Des pertes de données liées à des causes extérieures (panne réseau, force majeure).</Li>
                                <Li>De l&apos;exactitude des calculs CNPS/IRPP fournis par le module RH, qui sont indicatifs.</Li>
                            </ul>
                        </section>

                        {/* ── 13. Propriété intellectuelle ── */}
                        <section>
                            <H2>13. Propriété intellectuelle</H2>
                            <P>
                                L&apos;ensemble des éléments de la plateforme (logos, textes, interface, code source, algorithmes
                                de scoring) sont la propriété exclusive de Kbouffe, protégés par le droit camerounais
                                et les conventions internationales sur la propriété intellectuelle. Toute reproduction,
                                même partielle, est interdite sans autorisation écrite préalable.
                            </P>
                            <P>
                                Les Restaurateurs et Fournisseurs conservent la propriété de leur contenu (photos, descriptions,
                                prix). Ils accordent à Kbouffe une licence non exclusive d&apos;utilisation à des fins d&apos;affichage
                                sur la plateforme et de promotion des services Kbouffe.
                            </P>
                        </section>

                        {/* ── 14. Résiliation ── */}
                        <section>
                            <H2>14. Résiliation du compte</H2>
                            <P>
                                L&apos;Utilisateur peut résilier son compte à tout moment depuis les paramètres de la plateforme.
                                Kbouffe peut suspendre ou résilier un compte sans préavis en cas de :
                            </P>
                            <ul className="space-y-2 list-disc pl-6 mb-3">
                                <Li>Violation des présentes CGU ou de la législation camerounaise applicable.</Li>
                                <Li>Fourniture de documents falsifiés lors de l&apos;inscription (RCCM, NC, autorisation sanitaire).</Li>
                                <Li>Comportement frauduleux ou atteinte aux droits de tiers.</Li>
                                <Li>Non-paiement de l&apos;abonnement après mise en demeure.</Li>
                            </ul>
                        </section>

                        {/* ── 15. Droit applicable ── */}
                        <section>
                            <H2>15. Droit applicable et juridiction compétente</H2>
                            <P>
                                Les présentes CGU sont régies par le droit camerounais, notamment :
                            </P>
                            <ul className="space-y-2 list-disc pl-6 mb-3">
                                <Li>Loi n°2010/021 du 21 décembre 2010 régissant le commerce électronique au Cameroun.</Li>
                                <Li>Loi n°2010/012 du 21 décembre 2010 relative à la cybersécurité et à la cybercriminalité.</Li>
                                <Li>Loi n°2015/003 du 25 juin 2015 portant protection du consommateur au Cameroun.</Li>
                                <Li>Code Général des Impôts (CGI) du Cameroun.</Li>
                                <Li>Code du Travail camerounais, Loi n°92/007 du 14 août 1992.</Li>
                                <Li>Acte uniforme OHADA relatif au droit des sociétés commerciales.</Li>
                            </ul>
                            <P>
                                Tout litige relatif à l&apos;interprétation ou à l&apos;exécution des présentes CGU sera soumis
                                aux <Strong>tribunaux compétents de Yaoundé ou Douala (Cameroun)</Strong>, sauf accord amiable préalable.
                            </P>
                        </section>

                        {/* ── 16. Contact ── */}
                        <section>
                            <H2>16. Contact</H2>
                            <P>
                                Pour toute question relative aux présentes CGU ou pour exercer vos droits :
                            </P>
                            <ul className="space-y-2 list-disc pl-6">
                                <Li><Strong>E-mail :</Strong> legal@kbouffe.com</Li>
                                <Li><Strong>Données personnelles :</Strong> privacy@kbouffe.com</Li>
                                <Li><Strong>Support :</Strong> contact@kbouffe.com</Li>
                                <Li><Strong>Adresse :</Strong> Kbouffe, Yaoundé, Cameroun</Li>
                            </ul>
                        </section>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
