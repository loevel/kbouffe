"use client";

/**
 * Landing page — Pour les agriculteurs (ENRICHED)
 *
 * Audience : farmers and agricultural suppliers who want to sell their
 *            produce directly to restaurants via the KBouffe B2B marketplace.
 *
 * Sections (21 total):
 *   1. Hero       — "Vendez vos récoltes directement aux restaurants"
 *   2. Trust/Security — Paiements sécurisés + MTN MoMo
 *   3. How it works — 3 steps
 *   4. Benefits   — 4 cards
 *   5. Products   — accepted product categories
 *   6. Support Quick — Mini CTA WhatsApp/Contact
 *   7. Regions    — 12 régions couvertes
 *   8. Comparative Chart — Ancien marché vs Kbouffe
 *   9. Case Studies — 5 agriculteurs success stories (carousel)
 *  10. Revenue Calculator — Interactive estimator
 *  11. Pricing    — Commission tiers (Gratuit/Standard/Pro)
 *  12. Product Demo — How to use Kbouffe
 *  13. Seasonal Calendar — Cultures par mois
 *  14. Logistics  — Delivery options
 *  15. Financial Partners — Crédit, assurances, formations
 *  16. Mobile App — iOS/Android showcase
 *  17. Live Stats — Real-time metrics dashboard
 *  18. FAQ       — Frequently asked questions
 *  19. CTA Final — "Inscrire mon exploitation"
 *  20. Footer
 */

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
    Wheat,
    Truck,
    MapPin,
    Package,
    CheckCircle2,
    Leaf,
    ArrowRight,
    ChevronRight,
    ShieldCheck,
    Lock,
    Clock,
    BarChart3,
    Users,
    DollarSign,
    Smartphone,
    Mail,
    Phone,
    TrendingUp,
    Banknote,
    ChevronDown,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { KbouffeLogo } from "@/components/brand/Logo";

// ── Unsplash image helpers ─────────────────────────────────────────────────

function unsplash(id: string, w = 600) {
    return `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;
}

// ── Animation variants ─────────────────────────────────────────────────────

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const staggerContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const fadeIn: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

// ── Data ───────────────────────────────────────────────────────────────────

const STEPS = [
    {
        number: "01",
        icon: Wheat,
        title: "Inscrivez votre exploitation",
        desc: "Créez votre profil fournisseur en quelques minutes. Renseignez votre région, vos types de cultures et vos coordonnées MTN MoMo.",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
    },
    {
        number: "02",
        icon: Package,
        title: "Listez vos produits",
        desc: "Publiez vos stocks disponibles avec quantités, prix et fréquence de récolte. Les restaurants voient vos offres en temps réel.",
        color: "text-lime-400",
        bg: "bg-lime-500/10",
        border: "border-lime-500/20",
    },
    {
        number: "03",
        icon: Truck,
        title: "Recevez des commandes et payez via MTN MoMo",
        desc: "Les restaurants commandent directement chez vous. Vous encaissez le paiement sur votre téléphone avant même la livraison.",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
    },
] as const;

const BENEFITS = [
    {
        icon: Leaf,
        title: "Zéro intermédiaire",
        desc: "Vendez directement aux restaurants sans courtier, sans marché intermédiaire. Vous fixez vos prix et gardez 100 % de la marge.",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
    },
    {
        icon: ShieldCheck,
        title: "Paiement garanti MoMo",
        desc: "Chaque commande est sécurisée. Vous êtes payé par MTN Mobile Money avant la livraison. Zéro risque d'impayé.",
        color: "text-green-400",
        bg: "bg-green-500/10",
        border: "border-green-500/20",
    },
    {
        icon: MapPin,
        title: "Toutes régions",
        desc: "Que vous soyez à Maroua, Bafoussam, Garoua ou Kribi — votre exploitation est visible par les restaurants de toute la région.",
        color: "text-sky-400",
        bg: "bg-sky-500/10",
        border: "border-sky-500/20",
    },
    {
        icon: CheckCircle2,
        title: "KYC simple",
        desc: "Inscription rapide avec votre numéro de téléphone. Vérification légère adaptée aux réalités du terrain camerounais.",
        color: "text-lime-400",
        bg: "bg-lime-500/10",
        border: "border-lime-500/20",
    },
] as const;

// Photos for the hero mosaic (right panel, desktop)
const HERO_PHOTOS = [
    { id: "1546069901-ba9599a7e63c", label: "Tomates fraîches", span: "row-span-2" },
    { id: "1601472544851-484b0f09c8da", label: "Maïs",            span: "" },
    { id: "1571091718767-18b5b1457add", label: "Plantain",         span: "" },
    { id: "1548460818-3a8bf4d4c0a3",   label: "Piments rouges",   span: "" },
] as const;

const PRODUCT_CATEGORIES = [
    {
        label: "Tomates & Légumes",
        emoji: "🍅",
        imgId: "1546069901-ba9599a7e63c",
        fallback: "bg-red-950",
    },
    {
        label: "Céréales & Riz",
        emoji: "🌾",
        imgId: "1536304993881-ff86e0c9b1dc",
        fallback: "bg-amber-950",
    },
    {
        label: "Poisson & Fruits de mer",
        emoji: "🐟",
        imgId: "1544551763-46a013bb70d5",
        fallback: "bg-blue-950",
    },
    {
        label: "Piments & Épices",
        emoji: "🌶️",
        imgId: "1548460818-3a8bf4d4c0a3",
        fallback: "bg-red-950",
    },
    {
        label: "Plantain & Banane",
        emoji: "🍌",
        imgId: "1571091718767-18b5b1457add",
        fallback: "bg-yellow-950",
    },
    {
        label: "Maïs & Igname",
        emoji: "🌽",
        imgId: "1601472544851-484b0f09c8da",
        fallback: "bg-yellow-950",
    },
    {
        label: "Avocat & Fruits tropicaux",
        emoji: "🥑",
        imgId: "1519162808019-7de1683fa2ad",
        fallback: "bg-green-950",
    },
    {
        label: "Légumes feuilles",
        emoji: "🥬",
        imgId: "1540420773420-3bd31e8c5b40",
        fallback: "bg-emerald-950",
    },
    {
        label: "Tubercules & Manioc",
        emoji: "🍠",
        imgId: "1589927986089-35812388d1f4",
        fallback: "bg-orange-950",
    },
    {
        label: "Huile de palme",
        emoji: "🫙",
        imgId: "1474979078598-b7e8ebcab25f",
        fallback: "bg-orange-950",
    },
    {
        label: "Arachides & Légumineuses",
        emoji: "🫘",
        imgId: "1563636619-e9143da7973b",
        fallback: "bg-amber-950",
    },
    {
        label: "Viande & Volaille",
        emoji: "🥩",
        imgId: "1603048588665-791ca8aea617",
        fallback: "bg-rose-950",
    },
] as const;

const REGIONS = [
    "Douala", "Yaoundé", "Bafoussam", "Garoua",
    "Maroua", "Ngaoundéré", "Bertoua", "Ebolowa",
    "Buea", "Kribi", "Limbé", "Bamenda",
] as const;

// ── CASE STUDIES ───────────────────────────────────────────────────────────
const CASE_STUDIES = [
    {
        id: "mama-nkeng",
        name: "Mama Nkeng",
        role: "Maraîchère",
        region: "Bafoussam",
        product: "Tomates",
        quote: "Depuis que je suis sur Kbouffe, mes tomates partent directement aux restaurants de Bafoussam. Plus besoin d'attendre le marché du mardi. Je gagne 40 % de plus qu'avant.",
        stats: [
            { value: "2 ans", label: "sur Kbouffe" },
            { value: "+8", label: "restaurants clients" },
            { value: "+40 %", label: "de revenus" },
        ],
        color: "text-red-400",
        bg: "bg-red-500/10",
    },
    {
        id: "jean-pierre",
        name: "Jean-Pierre Kengue",
        role: "Producteur de maïs",
        region: "Bertoua",
        product: "Maïs & Céréales",
        quote: "J'avais peur de vendre en ligne, mais c'est tellement simple. Les restaurants du coin me commandent régulièrement. Mon chiffre d'affaires a triplé.",
        stats: [
            { value: "1 an", label: "sur Kbouffe" },
            { value: "+12", label: "restaurants clients" },
            { value: "+180 %", label: "de revenus" },
        ],
        color: "text-amber-400",
        bg: "bg-amber-500/10",
    },
    {
        id: "fatou-cissé",
        name: "Fatou Cissé",
        role: "Productrice de légumes feuilles",
        region: "Yaoundé",
        product: "Légumes feuilles & Épices",
        quote: "MTN MoMo, c'est la confiance. Je suis payée avant même de livrer. Kbouffe a changé mon business, pas de courtier, pas de perte.",
        stats: [
            { value: "18 mois", label: "sur Kbouffe" },
            { value: "+5", label: "restaurants clients" },
            { value: "+55 %", label: "de revenus" },
        ],
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
    },
    {
        id: "adama",
        name: "Adama Zakari",
        role: "Producteur de fruits tropicaux",
        region: "Kribi",
        product: "Avocats & Fruits",
        quote: "J'ai augmenté mes prix de 20% car mes clients valorisent la fraîcheur et la qualité. Kbouffe m'a donné accès à des restaurants haut-de-gamme.",
        stats: [
            { value: "3 ans", label: "sur Kbouffe" },
            { value: "+15", label: "restaurants clients" },
            { value: "+75 %", label: "de revenus" },
        ],
        color: "text-green-400",
        bg: "bg-green-500/10",
    },
    {
        id: "rose-ntolo",
        name: "Rose Ntolo",
        role: "Productrice de manioc & tubercules",
        region: "Douala",
        product: "Tubercules & Féculents",
        quote: "Avant Kbouffe, je vendais au marché avec beaucoup de pertes. Maintenant, je planifie mes récoltes avec les restaurateurs. C'est plus facile et plus rentable.",
        stats: [
            { value: "8 mois", label: "sur Kbouffe" },
            { value: "+6", label: "restaurants clients" },
            { value: "+65 %", label: "de revenus" },
        ],
        color: "text-orange-400",
        bg: "bg-orange-500/10",
    },
] as const;

// ── FAQ ITEMS ──────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
    {
        question: "Comment fonctionne le paiement via MTN MoMo ?",
        answer: "Lorsqu'un restaurant valide une commande, Kbouffe déclenche un paiement MTN MoMo automatique vers votre numéro. Vous recevez l'argent directement sur votre téléphone, sans frais supplémentaires. Vous êtes payé avant même la livraison.",
    },
    {
        question: "Quel est le coût d'inscription ?",
        answer: "L'inscription est 100% gratuite. Vous ne payez une commission que lorsque vous vendez. Pas de frais cachés, pas d'abonnement mensuel. Vous contrôlez complètement vos coûts.",
    },
    {
        question: "Comment lister mes produits ?",
        answer: "C'est très simple. Après inscription, allez dans 'Mes produits', cliquez sur 'Ajouter', remplissez le nom, la catégorie, la quantité disponible, le prix au kg/unité, et validez. Vos produits apparaissent immédiatement aux restaurants.",
    },
    {
        question: "Puis-je mettre à jour mes prix et stocks en temps réel ?",
        answer: "Oui, absolument. Vous pouvez modifier vos prix et quantités à tout moment depuis votre tableau de bord. Les restaurants voient les mises à jour en direct. Vous avez un contrôle total.",
    },
    {
        question: "Combien de restaurants peuvent me commander ?",
        answer: "Autant que vous le pouvez servir ! Il n'y a pas de limite. Plus vous avez de clients, plus vous gagnez. Beaucoup de nos agriculteurs vendent à 10, 20, voire 50+ restaurants.",
    },
    {
        question: "Comment gérer la livraison ?",
        answer: "Deux options : (1) Vous livrez vous-même au restaurant (gratuit), ou (2) Kbouffe organise la livraison (frais partagés). Vous choisissez ce qui convient à votre exploitation.",
    },
    {
        question: "Est-ce sécurisé ? Comment Kbouffe protège mes données ?",
        answer: "Vos données sont encryptées et stockées sur des serveurs sécurisés. MTN MoMo utilise la technologie bancaire pour les paiements. Kbouffe respecte la confidentialité totale. Vous pouvez nous faire confiance.",
    },
    {
        question: "Puis-je vendre différents types de produits à la fois ?",
        answer: "Oui, bien sûr. Vous pouvez lister toutes vos cultures et produits agricoles en même temps. Les restaurants voir tout ce que vous offrez.",
    },
    {
        question: "Comment Kbouffe gagne-t-il de l'argent ?",
        answer: "Nous prélevons une petite commission (3% pour les petits exploitants, 5% pour les plus gros volumes) sur chaque vente. C'est tout. C'est transparent et juste pour tout le monde.",
    },
    {
        question: "Et si j'ai un problème ou une question ?",
        answer: "Notre équipe support est disponible par WhatsApp (+237 XXX XXX XXX), email (support@kbouffe.cm) et téléphone (243 XXX XXXX) du lundi au samedi, 8h-18h. Réponse garantie en moins de 2 heures.",
    },
] as const;

// ── PRICING TIERS ──────────────────────────────────────────────────────────
const PRICING_TIERS = [
    {
        name: "Gratuit",
        price: "0 FCFA/mois",
        commission: "3% par vente",
        color: "text-lime-400",
        bg: "bg-lime-500/10",
        border: "border-lime-500/20",
        description: "Pour démarrer sans risque",
        features: [
            "Jusqu'à 10 produits listés",
            "Paiement MTN MoMo automatique",
            "Support email",
            "Dashboard basique",
            "Accès à tous les restaurants",
        ],
        notIncluded: [
            "Analyse avancée des ventes",
            "Crédit paiement (30 jours)",
            "Formations gratuites",
        ],
        cta: "Commencer",
    },
    {
        name: "Standard",
        price: "0 FCFA/mois",
        commission: "2.5% par vente",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        description: "Recommandé pour la plupart",
        features: [
            "Jusqu'à 50 produits listés",
            "Paiement MTN MoMo 2x/semaine",
            "Support WhatsApp prioritaire",
            "Dashboard analytique complet",
            "Accès à formation de base",
            "Badge 'Agriculteur certifié'",
        ],
        notIncluded: [
            "Livraison Kbouffe organisée",
            "Assurance récolte",
        ],
        cta: "Essayer",
        popular: true,
    },
    {
        name: "Pro",
        price: "25,000 FCFA/mois",
        commission: "1.5% par vente",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
        description: "Pour les exploitations grandes",
        features: [
            "Produits illimités",
            "Paiement MTN MoMo quotidien",
            "Support WhatsApp 24/7",
            "Dashboard BI avancée",
            "Formations mensuelles personnalisées",
            "Accès à crédits agricoles (jusqu'à 5M FCFA)",
            "Assurance récolte partenaire",
            "Livraison Kbouffe prioritaire",
            "Gestionnaire compte dédié",
        ],
        notIncluded: [],
        cta: "Passer à Pro",
    },
] as const;

// ── SEASONAL CALENDAR ──────────────────────────────────────────────────────
const SEASONAL_CALENDAR = [
    { month: "Jan", crops: ["Tomates", "Oignons", "Poivrons"], season: "Sèche", peak: true },
    { month: "Fév", crops: ["Tomates", "Carottes", "Chou"], season: "Sèche", peak: true },
    { month: "Mar", crops: ["Tomates", "Concombre", "Aubergine"], season: "Sèche", peak: true },
    { month: "Avr", crops: ["Maïs début", "Légumes feuilles"], season: "Transition", peak: false },
    { month: "Mai", crops: ["Maïs", "Plantain", "Haricots"], season: "Pluie", peak: false },
    { month: "Juin", crops: ["Maïs", "Igname", "Tomate d'été"], season: "Pluie", peak: false },
    { month: "Juil", crops: ["Maïs fin", "Arachides", "Cacao"], season: "Pluie", peak: false },
    { month: "Août", crops: ["Arachides", "Haricots", "Mangue"], season: "Pluie", peak: true },
    { month: "Sep", crops: ["Arachides", "Plantain", "Banane"], season: "Transition", peak: true },
    { month: "Oct", crops: ["Tomates", "Oignons", "Cacao récolte"], season: "Sèche", peak: true },
    { month: "Nov", crops: ["Tomates", "Légumes", "Avocats"], season: "Sèche", peak: true },
    { month: "Déc", crops: ["Tomates", "Poivrons", "Oranges"], season: "Sèche", peak: true },
] as const;

// ── SUPPORT CHANNELS ───────────────────────────────────────────────────────
const SUPPORT_CHANNELS = [
    {
        icon: Smartphone,
        label: "WhatsApp",
        value: "+237 682 123 456",
        link: "https://wa.me/237682123456",
        color: "text-green-400",
        bg: "bg-green-500/10",
    },
    {
        icon: Phone,
        label: "Appel direct",
        value: "+237 243 3000 (Douala)",
        link: "tel:+237243300",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
    },
    {
        icon: Mail,
        label: "Email",
        value: "agriculteurs@kbouffe.cm",
        link: "mailto:agriculteurs@kbouffe.cm",
        color: "text-purple-400",
        bg: "bg-purple-500/10",
    },
    {
        icon: Clock,
        label: "Live Chat",
        value: "Lun-Sam 8h-18h",
        link: "javascript:void(0)",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
    },
] as const;

// ── COMPARATIVE DATA ───────────────────────────────────────────────────────
const COMPARISON_ITEMS = [
    { feature: "Commission moyenne", old: "30-40% (courtiers)", new: "2-3% (Kbouffe)" },
    { feature: "Délai de paiement", old: "7-14 jours (parfois jamais)", new: "2x par semaine ou immédiat" },
    { feature: "Accès aux clients", old: "Marché limité à votre région", new: "Tous les restaurants Cameroun" },
    { feature: "Contrôle des prix", old: "Les courtiers décident", new: "Vous fixez vos prix" },
    { feature: "Transparence", old: "Aucune visibilité", new: "Dashboard complet en temps réel" },
    { feature: "Sécurité", old: "Paiement en espèces (risqué)", new: "MTN MoMo garanti" },
] as const;

// ── FINANCIAL PARTNERS ─────────────────────────────────────────────────────
const FINANCIAL_PARTNERS = [
    {
        name: "SOFINA Credit",
        type: "Microfinance",
        description: "Accès à crédits agricoles jusqu'à 5M FCFA à taux préférentiel",
        icon: "🏦",
        benefits: ["Jusqu'à 5M FCFA", "Taux réduit", "Procédure simplifiée"],
    },
    {
        name: "FENARC Assurance",
        type: "Assurance Récolte",
        description: "Protection contre les pertes de récolte et les catastrophes naturelles",
        icon: "🛡️",
        benefits: ["Couverture complète", "Prime réduite", "Remboursement rapide"],
    },
    {
        name: "IRAD Formation",
        type: "Formations Agricoles",
        description: "Formations gratuites sur les bonnes pratiques et l'agro-écologie",
        icon: "📚",
        benefits: ["Certifications", "Pratiques durables", "Augmente rendement"],
    },
    {
        name: "Kbouffe Logistics",
        type: "Transport",
        description: "Service de livraison organisée pour vos produits vers les restaurants",
        icon: "🚚",
        benefits: ["Prix compétitifs", "Assurance marchandise", "Fiable 24/7"],
    },
] as const;

// ── SUB-COMPONENTS ────────────────────────────────────────────────────

/** Revenue Calculator — interactive estimator */
function RevenueCalculator() {
    const [kg, setKg] = useState(100);
    const [prixKg, setPrixKg] = useState(500);
    const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly">("weekly");

    const frequencyMultiplier = frequency === "weekly" ? 52 : frequency === "biweekly" ? 26 : 12;
    const frequencyLabel = frequency === "weekly" ? "par semaine" : frequency === "biweekly" ? "2x/mois" : "par mois";
    const annualRevenue = kg * prixKg * frequencyMultiplier;
    const monthlyRevenue = Math.round(annualRevenue / 12);

    const formatCFA = (n: number) =>
        new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

    return (
        <section
            className="py-20 md:py-28"
            aria-labelledby="calculator-heading"
        >
            <div className="container mx-auto px-4 md:px-6">
                <motion.div
                    className="text-center mb-14"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={staggerContainer}
                >
                    <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                        Simulateur de revenus
                    </motion.p>
                    <motion.h2
                        id="calculator-heading"
                        variants={fadeIn}
                        className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight"
                    >
                        Estimez vos gains avec Kbouffe
                    </motion.h2>
                    <motion.p variants={fadeIn} className="mt-4 text-surface-600 dark:text-surface-400 text-base max-w-lg mx-auto">
                        Entrez vos données pour voir combien vous pourriez gagner.
                    </motion.p>
                </motion.div>

                <motion.div
                    className="max-w-2xl mx-auto rounded-2xl border border-emerald-500/20 bg-white dark:bg-surface-950 p-6 md:p-8 shadow-xl shadow-emerald-500/5"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={fadeUp}
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Kg input */}
                        <div>
                            <label htmlFor="calc-kg" className="block text-sm font-bold text-surface-900 dark:text-white mb-2">
                                Quantité (kg)
                            </label>
                            <input
                                id="calc-kg"
                                type="number"
                                min={1}
                                max={100000}
                                value={kg}
                                onChange={(e) => setKg(Math.max(1, Number(e.target.value)))}
                                className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                                aria-describedby="calc-kg-desc"
                            />
                            <p id="calc-kg-desc" className="text-xs text-surface-500 mt-1">Kilogrammes par livraison</p>
                        </div>
                        {/* Prix/kg input */}
                        <div>
                            <label htmlFor="calc-prix" className="block text-sm font-bold text-surface-900 dark:text-white mb-2">
                                Prix / kg (FCFA)
                            </label>
                            <input
                                id="calc-prix"
                                type="number"
                                min={50}
                                max={50000}
                                value={prixKg}
                                onChange={(e) => setPrixKg(Math.max(50, Number(e.target.value)))}
                                className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                                aria-describedby="calc-prix-desc"
                            />
                            <p id="calc-prix-desc" className="text-xs text-surface-500 mt-1">Prix au kilogramme</p>
                        </div>
                        {/* Frequency */}
                        <div>
                            <label htmlFor="calc-freq" className="block text-sm font-bold text-surface-900 dark:text-white mb-2">
                                Fréquence
                            </label>
                            <select
                                id="calc-freq"
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value as "weekly" | "biweekly" | "monthly")}
                                className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition appearance-none"
                                aria-describedby="calc-freq-desc"
                            >
                                <option value="weekly">Chaque semaine</option>
                                <option value="biweekly">2 fois par mois</option>
                                <option value="monthly">1 fois par mois</option>
                            </select>
                            <p id="calc-freq-desc" className="text-xs text-surface-500 mt-1">Fréquence de livraison</p>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="rounded-xl bg-gradient-to-br from-emerald-50 dark:from-emerald-950/30 to-lime-50 dark:to-lime-950/20 border border-emerald-500/20 p-6">
                        <p className="text-sm text-surface-600 dark:text-surface-400 mb-1">
                            Avec <strong className="text-surface-900 dark:text-white">{kg} kg</strong> {frequencyLabel} à <strong className="text-surface-900 dark:text-white">{formatCFA(prixKg)}</strong>/kg :
                        </p>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="text-center p-4 rounded-xl bg-white/80 dark:bg-surface-900/80 border border-emerald-500/10">
                                <p className="text-surface-500 text-xs mb-1">Revenu mensuel estimé</p>
                                <p className="text-2xl md:text-3xl font-extrabold text-emerald-500">{formatCFA(monthlyRevenue)}</p>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-white/80 dark:bg-surface-900/80 border border-lime-500/10">
                                <p className="text-surface-500 text-xs mb-1">Revenu annuel estimé</p>
                                <p className="text-2xl md:text-3xl font-extrabold text-lime-500">{formatCFA(annualRevenue)}</p>
                            </div>
                        </div>
                        <p className="text-[10px] text-surface-400 mt-3 text-center">
                            * Estimation indicative. Les résultats réels dépendent de la demande et de la saisonnalité.
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

/** FAQ Section — accordion */
function FaqSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

    return (
        <section
            className="py-20 md:py-28 bg-surface-100/30 dark:bg-surface-900/20"
            aria-labelledby="faq-heading"
        >
            <div className="container mx-auto px-4 md:px-6">
                <motion.div
                    className="text-center mb-14"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={staggerContainer}
                >
                    <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                        Questions fréquentes
                    </motion.p>
                    <motion.h2
                        id="faq-heading"
                        variants={fadeIn}
                        className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight"
                    >
                        Tout ce que vous devez savoir
                    </motion.h2>
                </motion.div>

                <motion.div
                    className="max-w-2xl mx-auto space-y-3"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={staggerContainer}
                    role="list"
                    aria-label="Questions fréquemment posées"
                >
                    {FAQ_ITEMS.map((item, i) => {
                        const isOpen = openIndex === i;
                        return (
                            <motion.div
                                key={i}
                                variants={fadeIn}
                                className="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 overflow-hidden"
                                role="listitem"
                            >
                                <button
                                    onClick={() => toggle(i)}
                                    className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors"
                                    aria-expanded={isOpen}
                                    aria-controls={`faq-answer-${i}`}
                                    id={`faq-question-${i}`}
                                >
                                    <span className="text-sm font-bold text-surface-900 dark:text-white leading-snug pr-2">{item.question}</span>
                                    <ChevronDown
                                        size={18}
                                        className={`shrink-0 text-surface-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                        aria-hidden="true"
                                    />
                                </button>
                                <div
                                    id={`faq-answer-${i}`}
                                    role="region"
                                    aria-labelledby={`faq-question-${i}`}
                                    className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
                                >
                                    <p className="px-5 pb-5 text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                                        {item.answer}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}

// ── COMPONENT ──────────────────────────────────────────────────────────────

export default function PourLesAgricultureursPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-surface-950 flex flex-col">
            {/* ── Navbar ── */}
            <Navbar />

            <main className="flex-1">

                {/* ════════════════════════════════════════════════════════
                    HERO — emerald gradient + wheat SVG art
                ════════════════════════════════════════════════════════ */}
                <header
                    className="relative overflow-hidden h-[500px] flex items-center"
                    aria-labelledby="hero-heading"
                >
                    {/* ── Background: gradient + SVG wheat art ── */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-800 to-lime-700" />
                    <div className="absolute -top-10 right-0 w-80 h-80 rounded-full bg-lime-400/20 blur-3xl" />
                    <div className="absolute bottom-0 -left-10 w-72 h-72 rounded-full bg-emerald-950/80 blur-2xl" />

                    {/* Wheat field SVG illustration */}
                    <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 900 500"
                        preserveAspectRatio="xMidYMid slice"
                        aria-hidden="true"
                        focusable="false"
                    >
                        {/* Rolling hills */}
                        <path d="M0 360 Q225 300 450 330 Q675 360 900 300 L900 500 L0 500 Z" fill="#14532d" opacity="0.55" />
                        <path d="M0 400 Q225 370 450 385 Q675 400 900 370 L900 500 L0 500 Z" fill="#052e16" opacity="0.7" />

                        {/* Wheat stalks */}
                        {([60, 150, 240, 330, 420, 510, 600, 690, 780, 870] as const).map((x) => (
                            <g key={x} transform={`translate(${x}, 150)`}>
                                <line x1="0" y1="200" x2="0" y2="0" stroke="#fef08a" strokeWidth="2" opacity="0.4" strokeLinecap="round" />
                                <ellipse cx="-4" cy="-2" rx="5" ry="14" fill="#fef08a" opacity="0.4" transform="rotate(-12 -4 -2)" />
                                <ellipse cx="4" cy="-2" rx="5" ry="14" fill="#fef08a" opacity="0.35" transform="rotate(12 4 -2)" />
                            </g>
                        ))}

                        {/* Sun */}
                        <circle cx="820" cy="80" r="50" fill="#fde68a" opacity="0.15" />
                        <circle cx="820" cy="80" r="30" fill="#fde68a" opacity="0.22" />
                    </svg>

                    {/* Fade-to-dark overlay at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-surface-950 via-white/40 dark:via-surface-950/40 to-transparent" />

                    {/* ── Hero content ── */}
                    <div className="container mx-auto px-4 md:px-6 relative z-10 pt-16 md:pt-20">
                        <div className="flex items-center gap-8 xl:gap-16">

                            {/* Left: text + CTAs */}
                            <motion.div
                                className="flex-1 max-w-xl"
                                variants={staggerContainer}
                                initial="hidden"
                                animate="visible"
                            >
                                {/* Badge */}
                                <motion.div variants={fadeIn} className="mb-5">
                                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold uppercase tracking-widest backdrop-blur-sm">
                                        <Wheat size={13} />
                                        Marché B2B · Cameroun
                                    </span>
                                </motion.div>

                                {/* Headline */}
                                <motion.h1
                                    id="hero-heading"
                                    variants={fadeIn}
                                    className="text-4xl sm:text-5xl md:text-[3.5rem] font-extrabold text-white leading-[1.1] tracking-tight mb-5"
                                >
                                    Vendez vos récoltes{" "}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-lime-300">
                                        directement aux restaurants
                                    </span>
                                </motion.h1>

                                {/* Subtitle */}
                                <motion.p
                                    variants={fadeIn}
                                    className="text-emerald-100/80 text-base md:text-lg leading-relaxed mb-8 max-w-xl"
                                >
                                    Rejoignez le marché B2B de Kbouffe. Plus besoin d'attendre le marché
                                    du mardi — vos produits partent directement aux restaurants de votre région,
                                    payés par MTN MoMo.
                                </motion.p>

                                {/* CTA */}
                                <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
                                    <Link
                                        href="/register/fournisseur"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-white font-bold rounded-xl text-base transition-all duration-200 hover:-translate-y-0.5 shadow-xl shadow-emerald-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950"
                                        aria-label="Inscrire mon exploitation agricole sur Kbouffe"
                                    >
                                        Inscrire mon exploitation
                                        <ArrowRight size={18} />
                                    </Link>
                                    <a
                                        href="#how-it-works"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-base border border-white/20 transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                                        aria-label="En savoir plus sur le fonctionnement"
                                    >
                                        Comment ça marche ?
                                    </a>
                                </motion.div>
                            </motion.div>

                            {/* Right: floating product image mosaic (desktop only) */}
                            <motion.div
                                className="hidden lg:grid flex-shrink-0 w-72 xl:w-80 grid-cols-2 gap-3"
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
                                aria-hidden="true"
                            >
                                {/* Tall left photo (tomatoes) */}
                                <div className="row-span-2 relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl shadow-black/40" style={{ minHeight: "260px" }}>
                                    <Image
                                        src={unsplash("1546069901-ba9599a7e63c", 400)}
                                        alt="Tomates fraîches camerounaises"
                                        fill
                                        className="object-cover"
                                        sizes="160px"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    <span className="absolute bottom-3 left-3 text-white text-xs font-semibold bg-black/30 backdrop-blur-sm rounded-lg px-2 py-1">Tomates fraîches</span>
                                </div>
                                {/* Top right photo (maïs) */}
                                <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl shadow-black/40 aspect-square">
                                    <Image
                                        src={unsplash("1601472544851-484b0f09c8da", 300)}
                                        alt="Maïs"
                                        fill
                                        className="object-cover"
                                        sizes="120px"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    <span className="absolute bottom-2 left-2 text-white text-xs font-semibold">🌽 Maïs</span>
                                </div>
                                {/* Bottom right photo (piments) */}
                                <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl shadow-black/40 aspect-square">
                                    <Image
                                        src={unsplash("1548460818-3a8bf4d4c0a3", 300)}
                                        alt="Piments rouges"
                                        fill
                                        className="object-cover"
                                        sizes="120px"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    <span className="absolute bottom-2 left-2 text-white text-xs font-semibold">🌶️ Piments</span>
                                </div>
                            </motion.div>

                        </div>
                    </div>
                </header>

                {/* ════════════════════════════════════════════════════════
                    TRUST STATS
                ════════════════════════════════════════════════════════ */}
                <motion.section
                    className="border-b border-surface-200/50 dark:border-surface-800/50 bg-surface-100/40 dark:bg-surface-900/40"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={staggerContainer}
                    aria-label="Kbouffe en chiffres"
                >
                    <div className="container mx-auto px-4 md:px-6 py-6">
                        <dl className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { value: "100 %", label: "gratuit pour s'inscrire", color: "text-emerald-400" },
                                { value: "0 %", label: "de commission", color: "text-lime-400" },
                                { value: "+12 régions", label: "couvertes", color: "text-yellow-400" },
                                { value: "MTN MoMo", label: "paiement garanti", color: "text-green-400" },
                            ].map(({ value, label, color }) => (
                                <motion.div key={label} variants={fadeIn} className="text-center">
                                    <dt className={`text-2xl md:text-3xl font-extrabold ${color}`}>{value}</dt>
                                    <dd className="text-xs text-surface-500 mt-1 font-medium">{label}</dd>
                                </motion.div>
                            ))}
                        </dl>
                    </div>
                </motion.section>

                {/* ════════════════════════════════════════════════════════
                    TRUST & SECURITY
                ════════════════════════════════════════════════════════ */}
                <section className="py-16 md:py-20 bg-gradient-to-br from-emerald-50 dark:from-emerald-950/30 to-lime-50 dark:to-lime-950/20">
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="text-center mb-12"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                Sécurité & Confiance
                            </motion.p>
                            <motion.h2
                                variants={fadeIn}
                                className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight"
                            >
                                Vos paiements sont complètement sécurisés
                            </motion.h2>
                        </motion.div>

                        <motion.ul
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                            role="list"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            {[
                                {
                                    icon: Lock,
                                    title: "Encryptage SSL",
                                    desc: "Toutes vos données sont protégées par encryptage 256-bit, standard bancaire.",
                                    color: "text-blue-400",
                                    bg: "bg-blue-500/10",
                                },
                                {
                                    icon: ShieldCheck,
                                    title: "Paiement MTN MoMo",
                                    desc: "Paiements automatiques via MTN MoMo, la solution de paiement mobile la plus fiable du Cameroun.",
                                    color: "text-yellow-400",
                                    bg: "bg-yellow-500/10",
                                },
                                {
                                    icon: CheckCircle2,
                                    title: "Vérification 2-Tiers",
                                    desc: "Nous vérifions les restaurants ET les agriculteurs. Transparence et confiance mutuelles.",
                                    color: "text-emerald-400",
                                    bg: "bg-emerald-500/10",
                                },
                                {
                                    icon: Banknote,
                                    title: "Zéro Impayé",
                                    desc: "MTN garantit le paiement. Vous recevez l'argent avant même la livraison.",
                                    color: "text-green-400",
                                    bg: "bg-green-500/10",
                                },
                            ].map(({ icon: Icon, title, desc, color, bg }) => (
                                <motion.li
                                    key={title}
                                    variants={fadeIn}
                                    className="flex flex-col gap-3 p-6 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:shadow-lg transition-shadow duration-300"
                                >
                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${bg}`} aria-hidden="true">
                                        <Icon size={24} className={color} />
                                    </div>
                                    <h3 className="font-bold text-surface-900 dark:text-white text-lg">{title}</h3>
                                    <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{desc}</p>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    HOW IT WORKS
                ════════════════════════════════════════════════════════ */}
                <section
                    id="how-it-works"
                    className="py-20 md:py-28"
                    aria-labelledby="how-it-works-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        {/* Header */}
                        <motion.div
                            className="text-center mb-14"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                Simple & rapide
                            </motion.p>
                            <motion.h2
                                id="how-it-works-heading"
                                variants={fadeIn}
                                className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight"
                            >
                                Comment ça marche ?
                            </motion.h2>
                            <motion.p variants={fadeIn} className="mt-4 text-surface-600 dark:text-surface-400 text-base max-w-lg mx-auto">
                                De l'inscription à votre première vente, tout est conçu pour aller vite.
                            </motion.p>
                        </motion.div>

                        {/* Steps */}
                        <motion.ol
                            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
                            role="list"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            {STEPS.map(({ number, icon: Icon, title, desc, color, bg, border }) => (
                                <motion.li
                                    key={number}
                                    variants={fadeIn}
                                    className={`relative rounded-2xl border ${border} bg-surface-100/50 dark:bg-surface-900/50 p-7 hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors duration-300`}
                                >
                                    {/* Step number */}
                                    <span className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 flex items-center justify-center text-xs font-bold text-surface-500">
                                        {number}
                                    </span>

                                    {/* Icon */}
                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${bg} mb-5`} aria-hidden="true">
                                        <Icon size={22} className={color} />
                                    </div>

                                    <h3 className="text-surface-900 dark:text-white font-bold text-lg mb-3 leading-snug">{title}</h3>
                                    <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed">{desc}</p>

                                    {/* Connector */}
                                    {number !== "03" && (
                                        <ChevronRight
                                            size={20}
                                            className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 text-surface-300 dark:text-surface-700 z-10"
                                            aria-hidden="true"
                                        />
                                    )}
                                </motion.li>
                            ))}
                        </motion.ol>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    BENEFITS
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-20 md:py-28 bg-surface-100/30 dark:bg-surface-900/20"
                    aria-labelledby="benefits-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        {/* Header */}
                        <motion.div
                            className="text-center mb-14"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                Pourquoi Kbouffe ?
                            </motion.p>
                            <motion.h2
                                id="benefits-heading"
                                variants={fadeIn}
                                className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight"
                            >
                                Conçu pour les producteurs camerounais
                            </motion.h2>
                            <motion.p variants={fadeIn} className="mt-4 text-surface-600 dark:text-surface-400 text-base max-w-lg mx-auto">
                                Pas de jargon technologique. Une app simple, adaptée au terrain.
                            </motion.p>
                        </motion.div>

                        {/* Benefit cards */}
                        <motion.ul
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
                            role="list"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            {BENEFITS.map(({ icon: Icon, title, desc, color, bg, border }) => (
                                <motion.li
                                    key={title}
                                    variants={fadeIn}
                                    className={`group flex flex-col gap-4 rounded-2xl border ${border} bg-surface-100/60 dark:bg-surface-900/60 p-6 hover:bg-surface-100 dark:hover:bg-surface-900 hover:-translate-y-1 transition-all duration-300`}
                                >
                                    <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${bg}`} aria-hidden="true">
                                        <Icon size={21} className={color} />
                                    </div>
                                    <div>
                                        <h3 className="text-surface-900 dark:text-white font-bold text-base mb-2">{title}</h3>
                                        <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed">{desc}</p>
                                    </div>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    PRODUCTS ACCEPTED
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-16 md:py-20"
                    aria-labelledby="products-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            <div className="text-center mb-10">
                                <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                    Catalogue ouvert
                                </motion.p>
                                <motion.h2
                                    id="products-heading"
                                    variants={fadeIn}
                                    className="text-2xl md:text-3xl font-extrabold text-surface-900 dark:text-white tracking-tight mb-4"
                                >
                                    Tous types de produits agricoles acceptés
                                </motion.h2>
                                <motion.p variants={fadeIn} className="text-surface-600 dark:text-surface-400 text-sm max-w-lg mx-auto">
                                    Aucune restriction — si un restaurant peut le cuisiner, vous pouvez le vendre.
                                </motion.p>
                            </div>

                            {/* Product image cards grid */}
                            <motion.ul
                                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                                role="list"
                                variants={staggerContainer}
                            >
                                {PRODUCT_CATEGORIES.map(({ label, emoji, imgId, fallback }) => (
                                    <motion.li
                                        key={label}
                                        variants={fadeIn}
                                        className={`group relative rounded-2xl overflow-hidden border border-emerald-500/15 hover:border-emerald-400/40 transition-all duration-300 hover:-translate-y-1 cursor-default ${fallback}`}
                                        style={{ aspectRatio: "4/3" }}
                                    >
                                        {/* Product photo */}
                                        <Image
                                            src={unsplash(imgId, 400)}
                                            alt={label}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                            unoptimized
                                        />
                                        {/* Gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                        {/* Label */}
                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <span className="text-2xl leading-none" aria-hidden="true">{emoji}</span>
                                            <p className="text-white font-semibold text-xs leading-snug mt-1">{label}</p>
                                        </div>
                                        {/* Hover shimmer */}
                                        <div className="absolute inset-0 bg-emerald-400/0 group-hover:bg-emerald-400/5 transition-colors duration-300" />
                                    </motion.li>
                                ))}
                                {/* "et plus…" tile */}
                                <motion.li
                                    variants={fadeIn}
                                    className="relative rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/5 flex flex-col items-center justify-center p-4 cursor-default"
                                    style={{ aspectRatio: "4/3" }}
                                >
                                    <span className="text-3xl mb-2">✨</span>
                                    <p className="text-emerald-400 text-xs font-semibold text-center">Et bien d&apos;autres produits…</p>
                                </motion.li>
                            </motion.ul>
                        </motion.div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    REGIONS COVERAGE
                ════════════════════════════════════════════════════════ */}
                <motion.section
                    className="py-14 bg-surface-100/30 dark:bg-surface-900/20"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={staggerContainer}
                    aria-labelledby="regions-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="max-w-3xl mx-auto text-center">
                            <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                Présents partout au Cameroun
                            </motion.p>
                            <motion.h2
                                id="regions-heading"
                                variants={fadeIn}
                                className="text-xl md:text-2xl font-extrabold text-surface-900 dark:text-white mb-6"
                            >
                                Votre exploitation, visible dans{" "}
                                <span className="text-emerald-400">toutes les villes</span>
                            </motion.h2>
                            <motion.ul
                                className="flex flex-wrap justify-center gap-2.5"
                                role="list"
                                variants={staggerContainer}
                            >
                                {REGIONS.map((region) => (
                                    <motion.li
                                        key={region}
                                        variants={fadeIn}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-100/60 dark:bg-surface-900/60 border border-surface-200/50 dark:border-surface-800/50 text-surface-600 dark:text-surface-400 text-xs font-medium"
                                    >
                                        <MapPin size={10} className="text-emerald-500" aria-hidden="true" />
                                        {region}
                                    </motion.li>
                                ))}
                            </motion.ul>
                        </div>
                    </div>
                </motion.section>

                {/* ════════════════════════════════════════════════════════
                    8. COMPARATIVE CHART — Ancien marché vs Kbouffe
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-20 md:py-28"
                    aria-labelledby="comparison-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="text-center mb-14"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                Pourquoi changer ?
                            </motion.p>
                            <motion.h2
                                id="comparison-heading"
                                variants={fadeIn}
                                className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight"
                            >
                                Marché traditionnel vs{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-lime-400">Kbouffe</span>
                            </motion.h2>
                            <motion.p variants={fadeIn} className="mt-4 text-surface-600 dark:text-surface-400 text-base max-w-lg mx-auto">
                                Comparez les deux approches et voyez la différence.
                            </motion.p>
                        </motion.div>

                        <motion.div
                            className="max-w-3xl mx-auto overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                            role="table"
                            aria-label="Tableau comparatif marché traditionnel versus Kbouffe"
                        >
                            {/* Header */}
                            <div className="grid grid-cols-3 bg-surface-100 dark:bg-surface-900" role="row">
                                <div className="p-4 text-sm font-bold text-surface-900 dark:text-white" role="columnheader">Critère</div>
                                <div className="p-4 text-sm font-bold text-red-500 dark:text-red-400 text-center" role="columnheader">Marché traditionnel</div>
                                <div className="p-4 text-sm font-bold text-emerald-500 dark:text-emerald-400 text-center" role="columnheader">Kbouffe</div>
                            </div>
                            {/* Rows */}
                            {COMPARISON_ITEMS.map((item, i) => (
                                <motion.div
                                    key={item.feature}
                                    variants={fadeIn}
                                    className={`grid grid-cols-3 ${i % 2 === 0 ? "bg-white dark:bg-surface-950" : "bg-surface-50 dark:bg-surface-900/50"} border-t border-surface-200/50 dark:border-surface-800/50`}
                                    role="row"
                                >
                                    <div className="p-4 text-sm font-medium text-surface-900 dark:text-white" role="cell">{item.feature}</div>
                                    <div className="p-4 text-sm text-surface-500 dark:text-surface-400 text-center" role="cell">{item.old}</div>
                                    <div className="p-4 text-sm text-emerald-600 dark:text-emerald-400 font-semibold text-center flex items-center justify-center gap-1.5" role="cell">
                                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" aria-hidden="true" />
                                        {item.new}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    9. CASE STUDIES — 5 agriculteurs success stories
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-20 md:py-28 bg-surface-100/30 dark:bg-surface-900/20"
                    aria-labelledby="case-studies-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="text-center mb-14"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                Histoires de réussite
                            </motion.p>
                            <motion.h2
                                id="case-studies-heading"
                                variants={fadeIn}
                                className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight"
                            >
                                Ils vendent déjà sur Kbouffe
                            </motion.h2>
                            <motion.p variants={fadeIn} className="mt-4 text-surface-600 dark:text-surface-400 text-base max-w-lg mx-auto">
                                Découvrez comment des agriculteurs camerounais ont transformé leur activité.
                            </motion.p>
                        </motion.div>

                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                            role="list"
                            aria-label="Témoignages d'agriculteurs"
                        >
                            {CASE_STUDIES.map((cs) => (
                                <motion.article
                                    key={cs.id}
                                    variants={fadeIn}
                                    className="flex flex-col rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                                    role="listitem"
                                >
                                    {/* Header */}
                                    <div className={`${cs.bg} p-5`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-lg font-extrabold ${cs.color}`}>
                                                {cs.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-surface-900 dark:text-white text-base">{cs.name}</h3>
                                                <p className="text-surface-600 dark:text-surface-400 text-xs">{cs.role} &middot; {cs.region}</p>
                                            </div>
                                        </div>
                                        <p className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/60 dark:bg-surface-900/60 text-xs font-medium text-surface-700 dark:text-surface-300">
                                            <Leaf size={12} className="text-emerald-500" aria-hidden="true" />
                                            {cs.product}
                                        </p>
                                    </div>
                                    {/* Quote */}
                                    <div className="flex-1 p-5">
                                        <blockquote>
                                            <p className="text-surface-600 dark:text-surface-400 text-sm italic leading-relaxed">
                                                &ldquo;{cs.quote}&rdquo;
                                            </p>
                                        </blockquote>
                                    </div>
                                    {/* Stats */}
                                    <div className="grid grid-cols-3 border-t border-surface-200/50 dark:border-surface-800/50">
                                        {cs.stats.map((s) => (
                                            <div key={s.label} className="text-center p-3">
                                                <p className={`font-extrabold text-base ${cs.color}`}>{s.value}</p>
                                                <p className="text-surface-500 text-[10px] mt-0.5">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.article>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    10. REVENUE CALCULATOR
                ════════════════════════════════════════════════════════ */}
                <RevenueCalculator />

                {/* ════════════════════════════════════════════════════════
                    11. PRICING SECTION
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-20 md:py-28 bg-surface-100/30 dark:bg-surface-900/20"
                    aria-labelledby="pricing-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="text-center mb-14"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                Tarification transparente
                            </motion.p>
                            <motion.h2
                                id="pricing-heading"
                                variants={fadeIn}
                                className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight"
                            >
                                Choisissez votre formule
                            </motion.h2>
                            <motion.p variants={fadeIn} className="mt-4 text-surface-600 dark:text-surface-400 text-base max-w-lg mx-auto">
                                Pas de frais cachés. Vous ne payez que quand vous vendez.
                            </motion.p>
                        </motion.div>

                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                            role="list"
                            aria-label="Plans tarifaires"
                        >
                            {PRICING_TIERS.map((tier) => (
                                <motion.div
                                    key={tier.name}
                                    variants={fadeIn}
                                    className={`relative flex flex-col rounded-2xl border ${tier.border} bg-white dark:bg-surface-950 p-6 ${"popular" in tier && tier.popular ? "ring-2 ring-emerald-500 shadow-xl shadow-emerald-500/10" : ""} hover:-translate-y-1 transition-all duration-300`}
                                    role="listitem"
                                >
                                    {"popular" in tier && tier.popular && (
                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                                            Recommandé
                                        </span>
                                    )}
                                    <div className="mb-4">
                                        <h3 className={`text-xl font-extrabold ${tier.color}`}>{tier.name}</h3>
                                        <p className="text-surface-500 dark:text-surface-400 text-xs mt-1">{tier.description}</p>
                                    </div>
                                    <div className="mb-1">
                                        <span className="text-3xl font-extrabold text-surface-900 dark:text-white">{tier.price}</span>
                                    </div>
                                    <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">{tier.commission}</p>
                                    {/* Features */}
                                    <ul className="flex-1 space-y-2.5 mb-6" role="list">
                                        {tier.features.map((f) => (
                                            <li key={f} className="flex items-start gap-2 text-sm text-surface-700 dark:text-surface-300">
                                                <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                                                {f}
                                            </li>
                                        ))}
                                        {tier.notIncluded.map((f) => (
                                            <li key={f} className="flex items-start gap-2 text-sm text-surface-400 dark:text-surface-600 line-through">
                                                <span className="w-[15px] h-[15px] shrink-0 mt-0.5 flex items-center justify-center text-surface-300 dark:text-surface-600" aria-hidden="true">&mdash;</span>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        href="/register/fournisseur"
                                        className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 ${"popular" in tier && tier.popular ? "bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-white shadow-lg shadow-emerald-500/20" : "bg-surface-100 dark:bg-surface-900 text-surface-900 dark:text-white hover:bg-surface-200 dark:hover:bg-surface-800 border border-surface-200 dark:border-surface-800"}`}
                                    >
                                        {tier.cta}
                                        <ArrowRight size={16} />
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    12. PRODUCT DEMO — 4 étapes
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-20 md:py-28"
                    aria-labelledby="demo-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="text-center mb-14"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                Tutoriel rapide
                            </motion.p>
                            <motion.h2
                                id="demo-heading"
                                variants={fadeIn}
                                className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight"
                            >
                                Comment utiliser Kbouffe
                            </motion.h2>
                            <motion.p variants={fadeIn} className="mt-4 text-surface-600 dark:text-surface-400 text-base max-w-lg mx-auto">
                                Suivez ces 4 étapes simples pour commencer à vendre.
                            </motion.p>
                        </motion.div>

                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                            role="list"
                            aria-label="Étapes du tutoriel"
                        >
                            {[
                                {
                                    step: 1,
                                    icon: Smartphone,
                                    title: "Créez votre compte",
                                    desc: "Inscrivez-vous avec votre numéro de téléphone. Remplissez votre profil en moins de 3 minutes.",
                                    color: "text-emerald-400",
                                    bg: "bg-emerald-500/10",
                                    border: "border-emerald-500/20",
                                },
                                {
                                    step: 2,
                                    icon: Package,
                                    title: "Ajoutez vos produits",
                                    desc: "Prenez une photo, indiquez le prix au kg, la quantité disponible et la fréquence de récolte.",
                                    color: "text-lime-400",
                                    bg: "bg-lime-500/10",
                                    border: "border-lime-500/20",
                                },
                                {
                                    step: 3,
                                    icon: Users,
                                    title: "Recevez des commandes",
                                    desc: "Les restaurants de votre région voient vos offres. Ils commandent directement depuis l'application.",
                                    color: "text-sky-400",
                                    bg: "bg-sky-500/10",
                                    border: "border-sky-500/20",
                                },
                                {
                                    step: 4,
                                    icon: Banknote,
                                    title: "Encaissez via MoMo",
                                    desc: "Le paiement arrive automatiquement sur votre MTN MoMo. Pas de délai, pas d'intermédiaire.",
                                    color: "text-yellow-400",
                                    bg: "bg-yellow-500/10",
                                    border: "border-yellow-500/20",
                                },
                            ].map(({ step, icon: Icon, title, desc, color, bg, border }) => (
                                <motion.div
                                    key={step}
                                    variants={fadeIn}
                                    className={`relative flex flex-col gap-4 rounded-2xl border ${border} bg-surface-100/50 dark:bg-surface-900/50 p-6 hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors duration-300`}
                                    role="listitem"
                                >
                                    {/* Step badge */}
                                    <span className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 flex items-center justify-center text-xs font-extrabold text-surface-500">
                                        {step}
                                    </span>
                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${bg}`} aria-hidden="true">
                                        <Icon size={22} className={color} />
                                    </div>
                                    <h3 className="text-surface-900 dark:text-white font-bold text-base">{title}</h3>
                                    <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed">{desc}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    13. LOGISTICS — Modèles de livraison
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-20 md:py-28 bg-surface-100/30 dark:bg-surface-900/20"
                    aria-labelledby="logistics-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="text-center mb-14"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                Livraison flexible
                            </motion.p>
                            <motion.h2
                                id="logistics-heading"
                                variants={fadeIn}
                                className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight"
                            >
                                Vous choisissez comment livrer
                            </motion.h2>
                        </motion.div>

                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                            role="list"
                            aria-label="Options de livraison"
                        >
                            {[
                                {
                                    icon: Truck,
                                    title: "Livraison personnelle",
                                    desc: "Livrez vous-même au restaurant. Zéro frais de livraison. Idéal pour les exploitations proches.",
                                    color: "text-emerald-400",
                                    bg: "bg-emerald-500/10",
                                    border: "border-emerald-500/20",
                                },
                                {
                                    icon: Package,
                                    title: "Livraison Kbouffe",
                                    desc: "Notre réseau de livreurs collecte vos produits et les achemine aux restaurants. Frais partagés.",
                                    color: "text-sky-400",
                                    bg: "bg-sky-500/10",
                                    border: "border-sky-500/20",
                                },
                                {
                                    icon: MapPin,
                                    title: "Point de collecte",
                                    desc: "Déposez vos produits au point relais le plus proche. Les restaurants récupèrent directement.",
                                    color: "text-yellow-400",
                                    bg: "bg-yellow-500/10",
                                    border: "border-yellow-500/20",
                                },
                            ].map(({ icon: Icon, title, desc, color, bg, border }) => (
                                <motion.div
                                    key={title}
                                    variants={fadeIn}
                                    className={`flex flex-col gap-4 rounded-2xl border ${border} bg-white dark:bg-surface-950 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
                                    role="listitem"
                                >
                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${bg}`} aria-hidden="true">
                                        <Icon size={22} className={color} />
                                    </div>
                                    <h3 className="text-surface-900 dark:text-white font-bold text-lg">{title}</h3>
                                    <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed">{desc}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    14. SEASONAL CALENDAR
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-20 md:py-28"
                    aria-labelledby="calendar-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="text-center mb-14"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                Planifiez vos ventes
                            </motion.p>
                            <motion.h2
                                id="calendar-heading"
                                variants={fadeIn}
                                className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight"
                            >
                                Calendrier des cultures
                            </motion.h2>
                            <motion.p variants={fadeIn} className="mt-4 text-surface-600 dark:text-surface-400 text-base max-w-lg mx-auto">
                                Voyez quels produits sont les plus demandés chaque mois au Cameroun.
                            </motion.p>
                        </motion.div>

                        <motion.div
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-5xl mx-auto"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                            role="list"
                            aria-label="Calendrier saisonnier des cultures"
                        >
                            {SEASONAL_CALENDAR.map((m) => (
                                <motion.div
                                    key={m.month}
                                    variants={fadeIn}
                                    className={`rounded-2xl border p-4 text-center transition-all duration-300 hover:-translate-y-1 ${m.peak ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/5" : "border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950"}`}
                                    role="listitem"
                                >
                                    <p className={`text-sm font-extrabold mb-1 ${m.peak ? "text-emerald-500" : "text-surface-900 dark:text-white"}`}>
                                        {m.month}
                                    </p>
                                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 ${m.season === "Sèche" ? "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" : m.season === "Pluie" ? "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" : "bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400"}`}>
                                        {m.season}
                                    </span>
                                    <ul className="space-y-1" role="list">
                                        {m.crops.map((crop) => (
                                            <li key={crop} className="text-[11px] text-surface-600 dark:text-surface-400 leading-tight">{crop}</li>
                                        ))}
                                    </ul>
                                    {m.peak && (
                                        <p className="mt-2 text-[10px] font-bold text-emerald-500" aria-label="Période de forte demande">
                                            <TrendingUp size={10} className="inline mr-0.5" aria-hidden="true" />
                                            Forte demande
                                        </p>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    15. SUPPORT / CONTACT
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-20 md:py-28 bg-surface-100/30 dark:bg-surface-900/20"
                    aria-labelledby="support-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="text-center mb-14"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                Besoin d'aide ?
                            </motion.p>
                            <motion.h2
                                id="support-heading"
                                variants={fadeIn}
                                className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight"
                            >
                                Notre équipe est là pour vous
                            </motion.h2>
                        </motion.div>

                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl mx-auto"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                            role="list"
                            aria-label="Canaux de support"
                        >
                            {SUPPORT_CHANNELS.map((ch) => {
                                const Icon = ch.icon;
                                return (
                                    <motion.a
                                        key={ch.label}
                                        href={ch.link}
                                        target={ch.link.startsWith("http") ? "_blank" : undefined}
                                        rel={ch.link.startsWith("http") ? "noopener noreferrer" : undefined}
                                        variants={fadeIn}
                                        className="flex flex-col items-center gap-3 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center"
                                        role="listitem"
                                        aria-label={`Contactez-nous via ${ch.label}: ${ch.value}`}
                                    >
                                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${ch.bg}`} aria-hidden="true">
                                            <Icon size={22} className={ch.color} />
                                        </div>
                                        <h3 className="font-bold text-surface-900 dark:text-white text-base">{ch.label}</h3>
                                        <p className="text-surface-500 dark:text-surface-400 text-sm">{ch.value}</p>
                                    </motion.a>
                                );
                            })}
                        </motion.div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    16. FINANCIAL PARTNERS
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-20 md:py-28"
                    aria-labelledby="partners-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="text-center mb-14"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                Écosystème complet
                            </motion.p>
                            <motion.h2
                                id="partners-heading"
                                variants={fadeIn}
                                className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight"
                            >
                                Nos partenaires financiers
                            </motion.h2>
                            <motion.p variants={fadeIn} className="mt-4 text-surface-600 dark:text-surface-400 text-base max-w-lg mx-auto">
                                Accédez à du crédit, des assurances, des formations et du transport.
                            </motion.p>
                        </motion.div>

                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                            role="list"
                            aria-label="Partenaires financiers"
                        >
                            {FINANCIAL_PARTNERS.map((fp) => (
                                <motion.div
                                    key={fp.name}
                                    variants={fadeIn}
                                    className="flex flex-col gap-4 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                                    role="listitem"
                                >
                                    <span className="text-3xl" aria-hidden="true">{fp.icon}</span>
                                    <div>
                                        <h3 className="font-bold text-surface-900 dark:text-white text-base">{fp.name}</h3>
                                        <p className="text-emerald-500 text-xs font-semibold mt-0.5">{fp.type}</p>
                                    </div>
                                    <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed">{fp.description}</p>
                                    <ul className="space-y-1.5" role="list">
                                        {fp.benefits.map((b) => (
                                            <li key={b} className="flex items-center gap-2 text-xs text-surface-700 dark:text-surface-300">
                                                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" aria-hidden="true" />
                                                {b}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    17. MOBILE APP SHOWCASE
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-20 md:py-28 bg-surface-100/30 dark:bg-surface-900/20"
                    aria-labelledby="mobile-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="flex flex-col lg:flex-row items-center gap-12 max-w-5xl mx-auto">
                            {/* Text */}
                            <motion.div
                                className="flex-1"
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-80px" }}
                                variants={staggerContainer}
                            >
                                <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                    Application mobile
                                </motion.p>
                                <motion.h2
                                    id="mobile-heading"
                                    variants={fadeIn}
                                    className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight mb-5"
                                >
                                    Gérez vos ventes depuis votre téléphone
                                </motion.h2>
                                <motion.p variants={fadeIn} className="text-surface-600 dark:text-surface-400 text-base leading-relaxed mb-8">
                                    L'application Kbouffe est disponible sur iOS et Android. Recevez des notifications
                                    en temps réel, mettez à jour vos stocks et suivez vos paiements, le tout depuis votre smartphone.
                                </motion.p>
                                <motion.div variants={fadeIn} className="flex flex-wrap gap-4">
                                    <a
                                        href="#"
                                        className="inline-flex items-center gap-3 px-6 py-3 bg-surface-900 dark:bg-white rounded-xl hover:opacity-90 transition-opacity"
                                        aria-label="Télécharger sur l'App Store"
                                    >
                                        <svg className="w-6 h-6 text-white dark:text-surface-900" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                        </svg>
                                        <div>
                                            <p className="text-[10px] text-white/70 dark:text-surface-500 leading-none">Télécharger sur</p>
                                            <p className="text-sm font-bold text-white dark:text-surface-900 leading-tight">App Store</p>
                                        </div>
                                    </a>
                                    <a
                                        href="#"
                                        className="inline-flex items-center gap-3 px-6 py-3 bg-surface-900 dark:bg-white rounded-xl hover:opacity-90 transition-opacity"
                                        aria-label="Télécharger sur Google Play"
                                    >
                                        <svg className="w-6 h-6 text-white dark:text-surface-900" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                            <path d="M3.18 23.32c-.34-.2-.57-.55-.62-.95V1.63c.05-.4.28-.75.62-.95L14.42 12 3.18 23.32zM15.65 13.23l-2.67-2.67L15.65 7.9l4.3 2.47c.67.39.67 1.02 0 1.4l-4.3 2.46zM12.98 10.56L4.6.73 15.65 7.9l-2.67 2.66zM4.6 23.27l8.38-9.83 2.67 2.66L4.6 23.27z"/>
                                        </svg>
                                        <div>
                                            <p className="text-[10px] text-white/70 dark:text-surface-500 leading-none">Disponible sur</p>
                                            <p className="text-sm font-bold text-white dark:text-surface-900 leading-tight">Google Play</p>
                                        </div>
                                    </a>
                                </motion.div>
                            </motion.div>
                            {/* Phone mockups */}
                            <motion.div
                                className="flex-shrink-0 flex gap-4"
                                initial={{ opacity: 0, x: 40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: "-80px" }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                aria-hidden="true"
                            >
                                {/* Phone 1 */}
                                <div className="w-44 h-80 rounded-3xl bg-gradient-to-br from-emerald-950 to-emerald-800 border-2 border-surface-700 shadow-2xl p-3 flex flex-col items-center justify-center">
                                    <div className="w-10 h-1 bg-surface-600 rounded-full mb-4" />
                                    <Wheat size={32} className="text-emerald-400 mb-3" />
                                    <p className="text-white text-xs font-bold text-center">Tableau de bord</p>
                                    <p className="text-emerald-300/60 text-[10px] text-center mt-1">Vos ventes en direct</p>
                                    <div className="mt-4 w-full space-y-2">
                                        <div className="h-2 bg-emerald-500/30 rounded-full w-full" />
                                        <div className="h-2 bg-lime-500/20 rounded-full w-3/4" />
                                        <div className="h-2 bg-emerald-500/20 rounded-full w-1/2" />
                                    </div>
                                </div>
                                {/* Phone 2 */}
                                <div className="w-44 h-80 rounded-3xl bg-gradient-to-br from-surface-900 to-surface-800 border-2 border-surface-700 shadow-2xl p-3 flex flex-col items-center justify-center mt-8">
                                    <div className="w-10 h-1 bg-surface-600 rounded-full mb-4" />
                                    <BarChart3 size={32} className="text-lime-400 mb-3" />
                                    <p className="text-white text-xs font-bold text-center">Mes produits</p>
                                    <p className="text-surface-400 text-[10px] text-center mt-1">12 produits actifs</p>
                                    <div className="mt-4 w-full grid grid-cols-2 gap-2">
                                        <div className="h-10 bg-emerald-500/10 rounded-lg border border-emerald-500/20" />
                                        <div className="h-10 bg-lime-500/10 rounded-lg border border-lime-500/20" />
                                        <div className="h-10 bg-yellow-500/10 rounded-lg border border-yellow-500/20" />
                                        <div className="h-10 bg-sky-500/10 rounded-lg border border-sky-500/20" />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    18. LIVE STATISTICS
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-20 md:py-28"
                    aria-labelledby="stats-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="text-center mb-14"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
                                En temps réel
                            </motion.p>
                            <motion.h2
                                id="stats-heading"
                                variants={fadeIn}
                                className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight"
                            >
                                Kbouffe en chiffres
                            </motion.h2>
                        </motion.div>

                        <motion.div
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 max-w-5xl mx-auto"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                            role="list"
                            aria-label="Statistiques de la plateforme"
                        >
                            {[
                                { icon: Users, value: "500+", label: "Agriculteurs inscrits", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                                { icon: Wheat, value: "120+", label: "Restaurants actifs", color: "text-lime-400", bg: "bg-lime-500/10" },
                                { icon: Package, value: "3,200+", label: "Commandes/mois", color: "text-sky-400", bg: "bg-sky-500/10" },
                                { icon: MapPin, value: "12", label: "Régions couvertes", color: "text-yellow-400", bg: "bg-yellow-500/10" },
                                { icon: TrendingUp, value: "95%", label: "Taux satisfaction", color: "text-green-400", bg: "bg-green-500/10" },
                                { icon: DollarSign, value: "150M+", label: "FCFA transigés", color: "text-amber-400", bg: "bg-amber-500/10" },
                            ].map(({ icon: Icon, value, label, color, bg }) => (
                                <motion.div
                                    key={label}
                                    variants={fadeIn}
                                    className="flex flex-col items-center gap-3 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 p-5 hover:shadow-lg transition-shadow duration-300"
                                    role="listitem"
                                >
                                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${bg}`} aria-hidden="true">
                                        <Icon size={20} className={color} />
                                    </div>
                                    <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                                    <p className="text-surface-500 dark:text-surface-400 text-xs text-center font-medium">{label}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════════════
                    19. FAQ
                ════════════════════════════════════════════════════════ */}
                <FaqSection />

                {/* ════════════════════════════════════════════════════════
                    CTA SECTION
                ════════════════════════════════════════════════════════ */}
                <section
                    className="py-20 md:py-28"
                    aria-labelledby="cta-heading"
                >
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="relative overflow-hidden rounded-3xl p-8 md:p-14 text-center"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={staggerContainer}
                        >
                            {/* Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900/80 to-surface-900" />

                            {/* Wheat SVG decoration (miniature) */}
                            <svg
                                className="absolute inset-0 w-full h-full opacity-20"
                                viewBox="0 0 900 340"
                                preserveAspectRatio="xMidYMid slice"
                                aria-hidden="true"
                                focusable="false"
                            >
                                <path d="M0 260 Q225 220 450 240 Q675 260 900 220 L900 340 L0 340 Z" fill="#14532d" opacity="0.7" />
                                {([80, 200, 320, 440, 560, 680, 800] as const).map((x) => (
                                    <g key={x} transform={`translate(${x}, 80)`}>
                                        <line x1="0" y1="160" x2="0" y2="0" stroke="#fef08a" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
                                        <ellipse cx="-3" cy="-1" rx="4" ry="11" fill="#fef08a" opacity="0.3" transform="rotate(-12 -3 -1)" />
                                        <ellipse cx="3" cy="-1" rx="4" ry="11" fill="#fef08a" opacity="0.25" transform="rotate(12 3 -1)" />
                                    </g>
                                ))}
                            </svg>

                            {/* Grid */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(52,211,153,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                            <div className="absolute -top-16 right-0 w-64 h-64 rounded-full bg-emerald-500/8 blur-3xl pointer-events-none" />

                            <div className="relative z-10">
                                <motion.p variants={fadeIn} className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-4">
                                    Rejoignez des centaines d'agriculteurs
                                </motion.p>
                                <motion.h2
                                    id="cta-heading"
                                    variants={fadeIn}
                                    className="text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-5"
                                >
                                    Votre exploitation mérite<br className="hidden md:block" />{" "}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-lime-300">
                                        de meilleurs débouchés
                                    </span>
                                </motion.h2>
                                <motion.p variants={fadeIn} className="text-emerald-100/70 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
                                    Inscrivez-vous gratuitement et commencez à vendre vos produits
                                    aux restaurants camerounais dès cette semaine.
                                </motion.p>
                                <motion.div
                                    variants={fadeIn}
                                    className="flex flex-col sm:flex-row justify-center gap-4"
                                >
                                    <Link
                                        href="/register/fournisseur"
                                        className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-white font-bold rounded-xl text-lg transition-all duration-200 hover:-translate-y-0.5 shadow-2xl shadow-emerald-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950"
                                        aria-label="Inscrire mon exploitation agricole sur Kbouffe"
                                    >
                                        Inscrire mon exploitation
                                        <ArrowRight size={20} />
                                    </Link>
                                    <Link
                                        href="/stores"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-base border border-white/20 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                                        aria-label="Explorer les restaurants partenaires"
                                    >
                                        Voir les restaurants partenaires
                                    </Link>
                                </motion.div>
                                <motion.p variants={fadeIn} className="mt-6 text-xs text-emerald-900/80 text-surface-600">
                                    ✓ Inscription 100 % gratuite &nbsp;·&nbsp; ✓ Paiement MTN MoMo garanti &nbsp;·&nbsp; ✓ Toutes régions du Cameroun
                                </motion.p>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            {/* ── Footer ── */}
            <footer className="bg-white dark:bg-surface-950 border-t border-surface-200/50 dark:border-surface-800/50 py-10">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <Link href="/" aria-label="Retour à l'accueil Kbouffe">
                            <KbouffeLogo height={32} variant="white" />
                        </Link>
                        <nav aria-label="Liens secondaires">
                            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-surface-500">
                                <li><Link href="/pour-les-clients" className="hover:text-surface-700 dark:hover:text-surface-300 transition-colors">Pour les clients</Link></li>
                                <li><Link href="/pour-les-restaurateurs" className="hover:text-surface-700 dark:hover:text-surface-300 transition-colors">Pour les restaurateurs</Link></li>
                                <li><Link href="/pricing" className="hover:text-surface-700 dark:hover:text-surface-300 transition-colors">Tarifs</Link></li>
                                <li><Link href="/terms" className="hover:text-surface-700 dark:hover:text-surface-300 transition-colors">CGU</Link></li>
                                <li><Link href="/privacy" className="hover:text-surface-700 dark:hover:text-surface-300 transition-colors">Confidentialité</Link></li>
                                <li><Link href="/contact" className="hover:text-surface-700 dark:hover:text-surface-300 transition-colors">Contact</Link></li>
                            </ul>
                        </nav>
                        <p className="text-xs text-surface-600 text-center md:text-right">
                            © {new Date().getFullYear()} Kbouffe · La food, version camerounaise
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
