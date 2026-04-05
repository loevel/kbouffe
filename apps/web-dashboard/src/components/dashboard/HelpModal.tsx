"use client";

import { useState } from "react";
import { X, Search, Book, Video, MessageSquare } from "lucide-react";
import { Input } from "@kbouffe/module-core/ui";

const helpArticles = [
    {
        id: "getting-started",
        category: "Débuter",
        title: "Premiers pas",
        description: "Guide de démarrage rapide pour votre restaurant",
        content: "Configurez votre profil restaurant, ajoutez vos produits, et commencez à accepter les commandes.",
    },
    {
        id: "orders",
        category: "Commandes",
        title: "Gérer les commandes",
        description: "Comment traiter et livrer les commandes",
        content: "Acceptez les commandes, mettez à jour le statut et gérez les livraisons.",
    },
    {
        id: "products",
        category: "Produits",
        title: "Gérer votre menu",
        description: "Ajouter et modifier les produits",
        content: "Créez des catégories, ajoutez des produits avec images et variantes.",
    },
    {
        id: "payments",
        category: "Paiements",
        title: "Configuration des paiements",
        description: "Accepter les paiements MTN MoMo",
        content: "Intégrez MTN Mobile Money pour recevoir les paiements directement.",
    },
    {
        id: "analytics",
        category: "Analytiques",
        title: "Comprendre vos données",
        description: "Interprétez les rapports et métriques",
        content: "Analysez vos ventes, évaluez les tendances et optimisez vos performances.",
    },
    {
        id: "support",
        category: "Support",
        title: "Contacter le support",
        description: "Obtenez de l'aide rapidement",
        content: "Nous sommes disponibles pour vous aider du lundi au vendredi, 9h-18h",
    },
];

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
    const [search, setSearch] = useState("");
    const [selectedArticle, setSelectedArticle] = useState<(typeof helpArticles)[0] | null>(null);

    const filteredArticles = helpArticles.filter(
        (article) =>
            article.title.toLowerCase().includes(search.toLowerCase()) ||
            article.description.toLowerCase().includes(search.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-surface-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white">Aide et documentation</h2>
                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                            Trouvez des réponses à vos questions
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-surface-500" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-surface-200 dark:border-surface-800">
                    <Input
                        placeholder="Rechercher..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full"
                        icon={<Search size={18} />}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {selectedArticle ? (
                        <div className="p-6">
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="text-brand-600 dark:text-brand-400 text-sm font-medium mb-4 hover:underline"
                            >
                                ← Retour
                            </button>
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-surface-900 dark:text-white">
                                    {selectedArticle.title}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded">
                                        {selectedArticle.category}
                                    </span>
                                </div>
                                <p className="text-surface-600 dark:text-surface-400">
                                    {selectedArticle.content}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6">
                            {filteredArticles.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-surface-500 dark:text-surface-400">
                                        Aucun article trouvé
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredArticles.map((article) => (
                                        <button
                                            key={article.id}
                                            onClick={() => setSelectedArticle(article)}
                                            className="w-full text-left p-4 border border-surface-200 dark:border-surface-800 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <Book size={20} className="text-brand-500 flex-shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-surface-900 dark:text-white">
                                                        {article.title}
                                                    </h4>
                                                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                                                        {article.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/30">
                    <button className="text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline flex items-center gap-2">
                        <MessageSquare size={16} />
                        Contacter le support
                    </button>
                </div>
            </div>
        </div>
    );
}
