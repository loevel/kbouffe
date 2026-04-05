"use client";

/**
 * QuickReplies -- Auto-suggestions et quick replies selon le type de message
 *
 * - Analyse le message_type (rfq, complaint, inquiry, order_note)
 * - Affiche suggestions contextuelles en bas de la modale
 * - Quick reply buttons avec textes courts
 * - Option auto-send (checkbox)
 */

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Zap,
    FileText,
    AlertTriangle,
    HelpCircle,
    ClipboardCheck,
    Send,
    CheckCircle2,
    Clock,
    Receipt,
    Handshake,
    Package,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type MessageType = "rfq" | "complaint" | "inquiry" | "order_note";

interface QuickRepliesProps {
    messageType: MessageType;
    onInsert: (text: string) => void;
    onAutoSend: (text: string) => void;
}

interface QuickReplyButton {
    id: string;
    icon: React.ReactNode;
    label: string;
    shortText: string;
}

interface SuggestionConfig {
    icon: React.ElementType;
    actionLabel: string;
    suggestionText: string;
    quickReplies: QuickReplyButton[];
}

// ── Suggestions config ────────────────────────────────────────────────────

const SUGGESTIONS: Record<MessageType, SuggestionConfig> = {
    rfq: {
        icon: Receipt,
        actionLabel: "Envoyer devis",
        suggestionText:
            "Merci pour votre demande. Voici notre meilleur prix pour la quantite demandee. N'hesitez pas a nous contacter pour toute question.",
        quickReplies: [
            {
                id: "stock",
                icon: <CheckCircle2 size={11} />,
                label: "En stock",
                shortText: "Produit disponible en stock. Pret a expedier.",
            },
            {
                id: "delai",
                icon: <Clock size={11} />,
                label: "Delai 2j",
                shortText: "Delai de livraison estime : 2 jours ouvrables.",
            },
            {
                id: "devis",
                icon: <Receipt size={11} />,
                label: "Devis envoye",
                shortText: "Devis envoye. Veuillez consulter les details ci-joints.",
            },
            {
                id: "volume",
                icon: <Package size={11} />,
                label: "Prix volume",
                shortText: "Tarif degressif disponible a partir de 5 unites.",
            },
        ],
    },
    complaint: {
        icon: AlertTriangle,
        actionLabel: "Proposer solution",
        suggestionText:
            "Nous sommes desoles pour ce desagrement. Nous prenons votre reclamation au serieux et proposons la solution suivante pour resoudre ce probleme rapidement.",
        quickReplies: [
            {
                id: "resolve",
                icon: <Handshake size={11} />,
                label: "Resolu",
                shortText: "Probleme identifie et resolu. Merci de votre patience.",
            },
            {
                id: "replace",
                icon: <Package size={11} />,
                label: "Remplacement",
                shortText: "Nous procedons au remplacement du produit concerne.",
            },
            {
                id: "credit",
                icon: <Receipt size={11} />,
                label: "Credit",
                shortText: "Un credit sera applique sur votre prochain achat.",
            },
            {
                id: "investigate",
                icon: <HelpCircle size={11} />,
                label: "Enquete",
                shortText: "Nous enqueteons sur le probleme. Retour sous 24h.",
            },
        ],
    },
    inquiry: {
        icon: HelpCircle,
        actionLabel: "Repondre",
        suggestionText:
            "Merci pour votre interet. Voici les informations demandees concernant nos produits et services.",
        quickReplies: [
            {
                id: "stock",
                icon: <CheckCircle2 size={11} />,
                label: "En stock",
                shortText: "Oui, ce produit est actuellement disponible.",
            },
            {
                id: "delai",
                icon: <Clock size={11} />,
                label: "Delai 2j",
                shortText: "Delai de livraison: 2-3 jours ouvrables.",
            },
            {
                id: "catalog",
                icon: <FileText size={11} />,
                label: "Catalogue",
                shortText: "Consultez notre catalogue pour plus de details sur nos produits.",
            },
            {
                id: "contact",
                icon: <Handshake size={11} />,
                label: "Contact direct",
                shortText: "Contactez-nous directement pour discuter de vos besoins.",
            },
        ],
    },
    order_note: {
        icon: ClipboardCheck,
        actionLabel: "Confirmer",
        suggestionText:
            "Note de commande bien recue. Nous avons pris en compte vos instructions et la commande est en cours de traitement.",
        quickReplies: [
            {
                id: "confirm",
                icon: <CheckCircle2 size={11} />,
                label: "Confirme",
                shortText: "Commande confirmee et en preparation.",
            },
            {
                id: "delai",
                icon: <Clock size={11} />,
                label: "Delai 2j",
                shortText: "Preparation en cours. Livraison prevue sous 2 jours.",
            },
            {
                id: "devis",
                icon: <Receipt size={11} />,
                label: "Devis envoye",
                shortText: "Devis mis a jour envoye selon vos specifications.",
            },
            {
                id: "resolve",
                icon: <Handshake size={11} />,
                label: "Resolu",
                shortText: "Note prise en compte. Modifications appliquees.",
            },
        ],
    },
};

// ── Component ─────────────────────────────────────────────────────────────

export function QuickReplies({ messageType, onInsert, onAutoSend }: QuickRepliesProps) {
    const [autoSend, setAutoSend] = useState(false);
    const config = SUGGESTIONS[messageType];
    const SuggestionIcon = config.icon;

    const handleQuickReply = useCallback(
        (text: string) => {
            if (autoSend) {
                onAutoSend(text);
            } else {
                onInsert(text);
            }
        },
        [autoSend, onInsert, onAutoSend]
    );

    const handleSuggestion = useCallback(() => {
        onInsert(config.suggestionText);
    }, [onInsert, config.suggestionText]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
        >
            {/* Suggestion action */}
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    type="button"
                    onClick={handleSuggestion}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/15 border border-brand-500/20 text-brand-300 text-xs font-medium transition-all"
                >
                    <SuggestionIcon size={12} />
                    {config.actionLabel}
                </button>

                <span className="text-[10px] text-surface-600">
                    Suggestion basee sur le type de message
                </span>
            </div>

            {/* Quick reply buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
                <Zap size={11} className="text-surface-500" />
                {config.quickReplies.map((qr) => (
                    <button
                        key={qr.id}
                        type="button"
                        onClick={() => handleQuickReply(qr.shortText)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-800 hover:bg-surface-700 border border-white/8 text-surface-300 hover:text-white text-[11px] font-medium transition-all"
                        title={qr.shortText}
                    >
                        {qr.icon}
                        {qr.label}
                    </button>
                ))}
            </div>

            {/* Auto-send checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none group">
                <div className="relative">
                    <input
                        type="checkbox"
                        checked={autoSend}
                        onChange={(e) => setAutoSend(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-4 h-4 rounded border border-white/15 bg-surface-800 peer-checked:bg-brand-500 peer-checked:border-brand-500 transition-all flex items-center justify-center">
                        {autoSend && <CheckCircle2 size={10} className="text-white" />}
                    </div>
                </div>
                <span className="text-[11px] text-surface-500 group-hover:text-surface-300 transition-colors">
                    Envoi automatique (clic = envoyer directement)
                </span>
                {autoSend && (
                    <Send size={10} className="text-brand-400" />
                )}
            </label>
        </motion.div>
    );
}
