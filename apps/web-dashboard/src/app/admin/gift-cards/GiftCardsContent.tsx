"use client";

import { useEffect, useState } from "react";
import {
  Gift,
  Plus,
  X,
  Copy,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  EyeOff,
  DollarSign,
  Calendar,
  User,
} from "lucide-react";
import { Button, Card } from "@kbouffe/module-core/ui";
import { AnimatePresence, motion } from "framer-motion";

interface GiftCard {
  id: string;
  code: string;
  initial_balance: number;
  current_balance: number;
  issued_to: string | null;
  note: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export default function GiftCardsContent() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    initial_balance: 10000,
    issued_to: "",
    note: "",
    expires_at: "",
  });

  // Fetch gift cards
  const fetchGiftCards = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/gift-cards?is_active=" + (showInactive ? "false" : "true"));
      if (response.ok) {
        const data = await response.json();
        setGiftCards(data.gift_cards || []);
      } else {
        setErrorMessage("Erreur lors du chargement des cartes");
      }
    } catch (error) {
      setErrorMessage("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiftCards();
  }, [showInactive]);

  // Create gift card
  const handleCreateGiftCard = async () => {
    if (formData.initial_balance <= 0) {
      setErrorMessage("Le montant doit être supérieur à 0");
      return;
    }

    setCreating(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initial_balance: formData.initial_balance,
          issued_to: formData.issued_to || null,
          note: formData.note || null,
          expires_at: formData.expires_at || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Immediately update the list and close modal
        setGiftCards([data.gift_card, ...giftCards]);
        setShowModal(false);
        setFormData({
          initial_balance: 10000,
          issued_to: "",
          note: "",
          expires_at: "",
        });
        setSuccessMessage(`✨ Carte cadeaux créée: ${data.gift_card.code}`);
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        // Show error message
        console.error("API Error:", data);
        setErrorMessage(data.error || `Erreur: ${response.status}`);
      }
    } catch (error) {
      console.error("Request Error:", error);
      setErrorMessage("Erreur réseau - vérifiez votre connexion");
    } finally {
      setCreating(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Delete gift card
  const handleDeleteGiftCard = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir désactiver cette carte ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/gift-cards/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setGiftCards(giftCards.filter((card) => card.id !== id));
        setSuccessMessage("Carte désactivée avec succès");
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Erreur lors de la désactivation");
      }
    } catch (error) {
      setErrorMessage("Erreur serveur");
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("fr-CM", { style: "currency", currency: "XAF" });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-CM", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Check if expired
  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-surface-900 dark:text-white flex items-center gap-3">
              <Gift className="w-8 h-8 text-brand-500" />
              Cartes Cadeaux
            </h1>
            <p className="text-surface-500 mt-2">Générez et gérez les cartes cadeaux pour vos clients</p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-black shadow-lg shadow-brand-500/20 flex items-center gap-2"
          >
            <Plus size={20} />
            Créer une carte
          </Button>
        </div>

        {/* Status Messages */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 flex items-start gap-3 text-emerald-700 dark:text-emerald-400"
          >
            <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{successMessage}</span>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3 text-red-700 dark:text-red-400"
          >
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{errorMessage}</span>
          </motion.div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Button
          variant={showInactive ? "outline" : "primary"}
          onClick={() => setShowInactive(false)}
          className="rounded-lg"
        >
          Actives ({giftCards.filter((g) => g.is_active).length})
        </Button>
        <Button
          variant={!showInactive ? "outline" : "primary"}
          onClick={() => setShowInactive(true)}
          className="rounded-lg"
        >
          Inactives
        </Button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-surface-100 dark:bg-surface-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : giftCards.length === 0 ? (
        <div className="text-center py-12">
          <Gift className="w-12 h-12 text-surface-300 dark:text-surface-700 mx-auto mb-4" />
          <p className="text-surface-500">Aucune carte cadeaux {showInactive ? "inactive" : "active"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {giftCards.map((card) => (
            <Card
              key={card.id}
              className="relative flex flex-col p-6 border-l-4 border-l-brand-500 hover:shadow-lg transition-shadow"
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                {isExpired(card.expires_at) ? (
                  <span className="text-xs px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold">
                    EXPIRÉ
                  </span>
                ) : !card.is_active ? (
                  <span className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 font-bold">
                    INACTIF
                  </span>
                ) : card.current_balance <= 0 ? (
                  <span className="text-xs px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-bold">
                    ÉPUISÉ
                  </span>
                ) : (
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold">
                    ACTIF
                  </span>
                )}
              </div>

              {/* Code Section */}
              <div className="mb-6 pt-4">
                <p className="text-xs text-surface-500 uppercase font-bold mb-2">Code</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-lg font-black text-brand-600 dark:text-brand-400 font-mono bg-surface-50 dark:bg-surface-800 px-3 py-2 rounded-lg">
                    {card.code}
                  </code>
                  <button
                    onClick={() => handleCopyCode(card.code)}
                    className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                  >
                    {copiedCode === card.code ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : (
                      <Copy size={18} className="text-surface-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Balance */}
              <div className="space-y-3 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={16} className="text-brand-500" />
                    <span className="text-xs text-surface-500 uppercase font-bold">Solde</span>
                  </div>
                  <p className="text-xl font-black">{formatCurrency(card.current_balance)}</p>
                  <p className="text-xs text-surface-400">Montant initial: {formatCurrency(card.initial_balance)}</p>
                </div>

                {/* Issued To */}
                {card.issued_to && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User size={16} className="text-surface-400" />
                      <span className="text-xs text-surface-500 uppercase font-bold">Émise à</span>
                    </div>
                    <p className="text-sm">{card.issued_to}</p>
                  </div>
                )}

                {/* Expiration */}
                {card.expires_at && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={16} className={isExpired(card.expires_at) ? "text-red-500" : "text-surface-400"} />
                      <span className="text-xs text-surface-500 uppercase font-bold">Expire</span>
                    </div>
                    <p className={`text-sm ${isExpired(card.expires_at) ? "text-red-600 dark:text-red-400" : ""}`}>
                      {formatDate(card.expires_at)}
                    </p>
                  </div>
                )}

                {/* Note */}
                {card.note && (
                  <div>
                    <p className="text-xs text-surface-500 uppercase font-bold mb-1">Note</p>
                    <p className="text-sm text-surface-600 dark:text-surface-400">{card.note}</p>
                  </div>
                )}
              </div>

              {/* Created Date & Delete Button */}
              <div className="flex items-center justify-between pt-4 border-t border-surface-200 dark:border-surface-800">
                <div className="text-xs text-surface-400">
                  Créée le {formatDate(card.created_at)}
                </div>
                {card.is_active && (
                  <button
                    onClick={() => handleDeleteGiftCard(card.id)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    title="Désactiver cette carte"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-8 text-white relative">
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center"
                >
                  <X size={18} />
                </button>
                <h2 className="text-2xl font-black flex items-center gap-2">
                  <Gift size={24} />
                  Créer une carte cadeaux
                </h2>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Balance Input */}
                <div>
                  <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">
                    Montant initial (FCFA)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.initial_balance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        initial_balance: Math.max(1, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full px-4 py-3 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-xs text-surface-500 mt-2">Le montant que le client pourra dépenser</p>
                </div>

                {/* Issued To */}
                <div>
                  <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">
                    Émise à (optionnel)
                  </label>
                  <input
                    type="text"
                    value={formData.issued_to}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        issued_to: e.target.value,
                      })
                    }
                    placeholder="Ex: Jean Dupont"
                    className="w-full px-4 py-3 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Expiration */}
                <div>
                  <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">
                    Date d'expiration (optionnel)
                  </label>
                  <input
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expires_at: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">
                    Note interne (optionnel)
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        note: e.target.value,
                      })
                    }
                    placeholder="Ex: Promotion de printemps, Cadeau VIP..."
                    rows={3}
                    className="w-full px-4 py-3 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50 p-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl"
                  disabled={creating}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateGiftCard}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-black shadow-lg shadow-brand-500/20"
                  disabled={creating || formData.initial_balance <= 0}
                >
                  {creating ? "Création..." : "Créer la carte"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
