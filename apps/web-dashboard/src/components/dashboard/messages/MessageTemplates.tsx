"use client";

import { useState } from "react";
import { MessageSquareDashed, ChevronDown, ChevronUp } from "lucide-react";

interface Template {
    id: string;
    label: string;
    text: string;
    category: "livraison" | "retard" | "confirmation" | "remerciement" | "annulation";
}

export const MESSAGE_TEMPLATES: Template[] = [
    { id: "merci",        label: "Remerciement",       category: "remerciement", text: "Merci pour votre commande ! Nous la préparons avec soin. 🙏" },
    { id: "confirm",      label: "Confirmation",       category: "confirmation", text: "Votre commande est confirmée et en cours de préparation. Nous vous informerons dès qu'elle sera prête." },
    { id: "prete",        label: "Commande prête",     category: "livraison",    text: "Bonne nouvelle ! Votre commande est prête. Notre livreur est en route. 🛵" },
    { id: "retard",       label: "Retard livraison",   category: "retard",       text: "Nous nous excusons pour le léger retard. Votre commande arrive dans 10–15 minutes. Merci de votre patience." },
    { id: "retard-cuisi", label: "Retard préparation", category: "retard",       text: "La préparation prend un peu plus de temps que prévu. Nous faisons de notre mieux. Désolé pour l'attente !" },
    { id: "livree",       label: "Livrée",             category: "livraison",    text: "Votre commande vient d'être livrée. Bon appétit ! N'hésitez pas à laisser un avis. 😊" },
    { id: "cancel",       label: "Annulation",         category: "annulation",   text: "Malheureusement, nous devons annuler votre commande. Vous serez remboursé dans les plus brefs délais. Toutes nos excuses." },
    { id: "indispo",      label: "Produit indispo",    category: "annulation",   text: "Un produit de votre commande n'est plus disponible. Nous vous contactons pour un ajustement ou remboursement." },
];

const CATEGORY_COLORS: Record<Template["category"], string> = {
    livraison:    "bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400",
    retard:       "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    confirmation: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
    remerciement: "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
    annulation:   "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400",
};

interface MessageTemplatesProps {
    onSelect: (text: string) => void;
}

export function MessageTemplates({ onSelect }: MessageTemplatesProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
            <button
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-750 transition-colors text-sm"
            >
                <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <MessageSquareDashed size={15} />
                    <span className="font-medium">Réponses rapides</span>
                </div>
                {expanded ? <ChevronUp size={15} className="text-surface-400" /> : <ChevronDown size={15} className="text-surface-400" />}
            </button>

            {expanded && (
                <div className="p-3 grid grid-cols-1 gap-1.5 bg-white dark:bg-surface-900">
                    {MESSAGE_TEMPLATES.map((tmpl) => (
                        <button
                            key={tmpl.id}
                            onClick={() => onSelect(tmpl.text)}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-left group"
                        >
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${CATEGORY_COLORS[tmpl.category]}`}>
                                {tmpl.label}
                            </span>
                            <p className="text-xs text-surface-600 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-white transition-colors line-clamp-2">
                                {tmpl.text}
                            </p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
