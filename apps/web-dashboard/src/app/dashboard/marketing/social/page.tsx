"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Send,
    Wand2,
    Loader2,
    Facebook,
    Instagram,
    MessageCircle,
    Clock,
    CheckCircle2,
    XCircle,
    Copy,
    Calendar,
    ImagePlus,
    Sparkles,
    ChevronDown,
    RefreshCw,
    Trash2,
    RotateCcw,
    Pencil,
} from "lucide-react";
import { Card, Button, Textarea, Input, toast, useDashboard } from "@kbouffe/module-core/ui";
import { useProducts } from "@/hooks/use-data";
import { usePremiumCheck } from "@/hooks/use-premium";
import { PremiumUpgradeCard } from "@/components/dashboard/PremiumUpgradeCard";

// Platform config
const PLATFORMS = [
    { id: "facebook", label: "Facebook", icon: Facebook, color: "bg-blue-500", textColor: "text-blue-500" },
    { id: "instagram", label: "Instagram", icon: Instagram, color: "bg-pink-500", textColor: "text-pink-500" },
    { id: "tiktok", label: "TikTok", icon: MessageCircle, color: "bg-black dark:bg-white", textColor: "text-surface-900 dark:text-white" },
    { id: "telegram", label: "Telegram", icon: Send, color: "bg-sky-500", textColor: "text-sky-500" },
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "bg-green-500", textColor: "text-green-500" },
] as const;

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    draft: { label: "Brouillon", icon: Clock, color: "text-surface-400" },
    scheduled: { label: "Programme", icon: Calendar, color: "text-blue-500" },
    publishing: { label: "En cours...", icon: Loader2, color: "text-amber-500" },
    published: { label: "Publie", icon: CheckCircle2, color: "text-green-500" },
    failed: { label: "Echec", icon: XCircle, color: "text-red-500" },
};

type SocialPost = {
    id: string;
    platform: string;
    content: string;
    image_url?: string;
    status: string;
    scheduled_at?: string;
    published_at?: string;
    error_message?: string;
    created_at: string;
};

type SocialAccount = {
    id: string;
    platform: string;
    account_name?: string;
    is_connected: boolean;
};

function SocialPublisherContent() {
    const dashboard = useDashboard();
    const restaurantName = dashboard?.restaurant?.name ?? "";
    const { products } = useProducts();
    const composeRef = useRef<HTMLDivElement>(null);

    // State
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState<string | null>(null);

    // Compose state
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["facebook"]);
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [selectedProductId, setSelectedProductId] = useState("");
    const [scheduledAt, setScheduledAt] = useState("");
    const [publishing, setPublishing] = useState(false);

    // AI generation
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResults, setAiResults] = useState<{ platform: string; content: string; hashtags: string[] }[]>([]);
    const [showProductPicker, setShowProductPicker] = useState(false);

    // Connection / disconnection modal
    const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
    const [connectForm, setConnectForm] = useState({ account_name: "", access_token: "", page_id: "", chat_id: "" });
    const [disconnecting, setDisconnecting] = useState<string | null>(null);

    // Fetch accounts and posts
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [accRes, postRes] = await Promise.all([
                fetch("/api/social/accounts"),
                fetch("/api/social/publish"),
            ]);
            const accData = await accRes.json();
            const postData = await postRes.json();
            setAccounts(accData.accounts ?? []);
            setPosts(postData.posts ?? []);
        } catch {
            toast.error("Erreur de chargement");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Toggle platform selection
    const togglePlatform = (platformId: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(platformId)
                ? prev.filter(p => p !== platformId)
                : [...prev, platformId]
        );
    };

    // AI Content Generation
    const handleGenerateContent = async () => {
        const selectedProduct = products.find((p: any) => p.id === selectedProductId);
        const productName = selectedProduct ? (selectedProduct as any).name : content.trim().slice(0, 50) || restaurantName;

        if (!productName) {
            toast.error("Selectionnez un produit ou ecrivez du contenu");
            return;
        }

        setAiLoading(true);
        setAiResults([]);
        try {
            const res = await fetch("/api/social/generate-content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productName,
                    description: selectedProduct ? (selectedProduct as any).description : "",
                    platform: selectedPlatforms.length === 1 ? selectedPlatforms[0] : "all",
                    price: selectedProduct ? (selectedProduct as any).price : undefined,
                    restaurantName,
                }),
            });
            const data = await res.json();
            if (data.posts?.length) {
                setAiResults(data.posts);
                // Auto-fill content with first matching platform
                const match = data.posts.find((p: any) => selectedPlatforms.includes(p.platform));
                if (match) {
                    setContent(match.content);
                }
                toast.success(`${data.posts.length} publication(s) generee(s) par l'IA`);
            } else {
                toast.error(data.error ?? "Aucun contenu genere");
            }
        } catch {
            toast.error("Erreur de connexion au service IA");
        } finally {
            setAiLoading(false);
        }
    };

    // Publish
    const handlePublish = async () => {
        if (!content.trim()) {
            toast.error("Le contenu est requis");
            return;
        }
        if (selectedPlatforms.length === 0) {
            toast.error("Selectionnez au moins une plateforme");
            return;
        }

        setPublishing(true);
        let successCount = 0;
        let failCount = 0;

        for (const platform of selectedPlatforms) {
            // Use AI-generated content for this specific platform if available
            const aiPost = aiResults.find(r => r.platform === platform);
            const postContent = aiPost ? aiPost.content : content;

            try {
                const res = await fetch("/api/social/publish", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        platform,
                        content: postContent,
                        image_url: imageUrl || undefined,
                        product_id: selectedProductId || undefined,
                        scheduled_at: scheduledAt || undefined,
                    }),
                });
                const data = await res.json();
                if (data.success || data.post?.status === "scheduled" || data.post?.status === "draft") {
                    successCount++;
                } else {
                    failCount++;
                    if (data.message) toast.error(`${platform}: ${data.message}`);
                }
            } catch {
                failCount++;
            }
        }

        if (successCount > 0) {
            toast.success(`${successCount} publication(s) envoyee(s)`);
            setContent("");
            setImageUrl("");
            setSelectedProductId("");
            setScheduledAt("");
            setAiResults([]);
            fetchData();
        }
        if (failCount > 0 && successCount === 0) {
            toast.error("Echec de publication");
        }

        setPublishing(false);
    };

    // Connect account
    const handleConnect = async () => {
        if (!connectingPlatform) return;

        try {
            const res = await fetch("/api/social/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform: connectingPlatform,
                    ...connectForm,
                }),
            });
            const data = await res.json();
            if (data.account) {
                toast.success(`Compte ${connectingPlatform} connecte`);
                setConnectingPlatform(null);
                setConnectForm({ account_name: "", access_token: "", page_id: "", chat_id: "" });
                fetchData();
            } else {
                toast.error(data.error ?? "Erreur de connexion");
            }
        } catch {
            toast.error("Erreur serveur");
        }
    };

    // Disconnect account
    const handleDisconnect = async (platformId: string) => {
        setDisconnecting(platformId);
        try {
            const res = await fetch(`/api/social/accounts?platform=${platformId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                toast.success(`Compte ${PLATFORMS.find(p => p.id === platformId)?.label} déconnecté`);
                fetchData();
            } else {
                toast.error(data.error ?? "Erreur de déconnexion");
            }
        } catch {
            toast.error("Erreur serveur");
        } finally {
            setDisconnecting(null);
        }
    };

    // Retry a failed/draft post
    const handleRetry = async (post: SocialPost) => {
        setRetrying(post.id);
        try {
            const res = await fetch("/api/social/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform: post.platform,
                    content: post.content,
                    image_url: post.image_url || undefined,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Relancé sur ${post.platform} !`);
            } else {
                toast.error(data.message ?? "Echec de la republication");
            }
            fetchData();
        } catch {
            toast.error("Erreur serveur");
        } finally {
            setRetrying(null);
        }
    };

    // Load a post into the compose form
    const loadIntoCompose = (post: SocialPost) => {
        setContent(post.content);
        setImageUrl(post.image_url ?? "");
        setSelectedPlatforms([post.platform]);
        setAiResults([]);
        setScheduledAt("");
        setSelectedProductId("");
        composeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        toast.success("Contenu chargé dans l'éditeur");
    };

    // Copy content
    const copyContent = (text: string) => {
        navigator.clipboard?.writeText(text);
        toast.success("Copie dans le presse-papier");
    };

    const isConnected = (platformId: string) =>
        accounts.some(a => a.platform === platformId && a.is_connected);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                    Social Publisher
                </h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">
                    Publiez du contenu sur vos reseaux sociaux en un clic, avec l'aide de l'IA.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Compose Panel */}
                <div ref={composeRef} className="lg:col-span-2 space-y-4">
                    {/* Platform Selection */}
                    <Card>
                        <h3 className="font-semibold text-surface-900 dark:text-white mb-3">Plateformes</h3>
                        <div className="flex flex-wrap gap-2">
                            {PLATFORMS.map(p => {
                                const connected = isConnected(p.id);
                                const selected = selectedPlatforms.includes(p.id);
                                const Icon = p.icon;
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => togglePlatform(p.id)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                                            selected
                                                ? `border-surface-900 dark:border-white bg-surface-900 dark:bg-white text-white dark:text-surface-900`
                                                : "border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-400"
                                        }`}
                                    >
                                        <Icon size={16} />
                                        {p.label}
                                        {connected && <CheckCircle2 size={12} className="text-green-500" />}
                                    </button>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Content */}
                    <Card>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-surface-900 dark:text-white">Contenu</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowProductPicker(!showProductPicker)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg transition-colors"
                                >
                                    <ChevronDown size={12} />
                                    Produit
                                </button>
                                <button
                                    type="button"
                                    onClick={handleGenerateContent}
                                    disabled={aiLoading}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-lg transition-colors disabled:opacity-40"
                                >
                                    {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                                    {aiLoading ? "Generation..." : "IA Magique"}
                                </button>
                            </div>
                        </div>

                        {/* Product picker dropdown */}
                        {showProductPicker && (
                            <div className="mb-3 p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 max-h-48 overflow-y-auto">
                                <button
                                    type="button"
                                    onClick={() => { setSelectedProductId(""); setShowProductPicker(false); }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedProductId ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600" : "hover:bg-surface-100 dark:hover:bg-surface-700"}`}
                                >
                                    Aucun (texte libre)
                                </button>
                                {products.map((p: any) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => { setSelectedProductId(p.id); setShowProductPicker(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedProductId === p.id ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600" : "hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300"}`}
                                    >
                                        <span className="font-medium">{p.name}</span>
                                        {p.price && <span className="ml-2 text-xs text-surface-400">{p.price} FCFA</span>}
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectedProductId && (
                            <div className="mb-3 flex items-center gap-2 p-2 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-sm">
                                <Sparkles size={14} className="text-brand-500" />
                                <span className="text-brand-700 dark:text-brand-300">
                                    Produit : <strong>{(products.find((p: any) => p.id === selectedProductId) as any)?.name}</strong>
                                </span>
                                <button type="button" onClick={() => setSelectedProductId("")} className="ml-auto text-surface-400 hover:text-red-500">
                                    <XCircle size={14} />
                                </button>
                            </div>
                        )}

                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Ecrivez votre publication ou utilisez l'IA pour generer du contenu..."
                            rows={6}
                        />
                        <p className="text-xs text-surface-400 mt-1">{content.length} caracteres</p>

                        {/* AI Results */}
                        {aiResults.length > 0 && (
                            <div className="mt-4 space-y-3">
                                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                                    <Wand2 size={12} />
                                    Contenu genere par l'IA — cliquez pour utiliser :
                                </p>
                                {aiResults.map((result, idx) => {
                                    const platformInfo = PLATFORMS.find(p => p.id === result.platform);
                                    const PlatformIcon = platformInfo?.icon ?? MessageCircle;
                                    return (
                                        <div
                                            key={idx}
                                            className="p-3 rounded-xl border border-purple-200 dark:border-purple-500/20 bg-purple-50/50 dark:bg-purple-500/5 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-500/15 transition-colors"
                                            onClick={() => setContent(result.content)}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <PlatformIcon size={14} className={platformInfo?.textColor} />
                                                <span className="text-xs font-bold uppercase tracking-wider text-purple-500">
                                                    {result.platform}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); copyContent(result.content); }}
                                                    className="ml-auto text-surface-400 hover:text-surface-600"
                                                >
                                                    <Copy size={12} />
                                                </button>
                                            </div>
                                            <p className="text-sm text-surface-700 dark:text-surface-300 line-clamp-4 whitespace-pre-wrap">
                                                {result.content}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>

                    {/* Image & Schedule */}
                    <Card>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                    <span className="flex items-center gap-1.5"><ImagePlus size={14} /> Image (optionnel)</span>
                                </label>
                                <Input
                                    placeholder="https://... URL de l'image"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                    <span className="flex items-center gap-1.5"><Calendar size={14} /> Programmer (optionnel)</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={scheduledAt}
                                    onChange={(e) => setScheduledAt(e.target.value)}
                                    className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                        </div>

                        {imageUrl && (
                            <div className="mt-3">
                                <img src={imageUrl} alt="Preview" className="w-24 h-24 rounded-lg object-cover" />
                            </div>
                        )}

                        <div className="mt-4 flex gap-3">
                            <Button
                                onClick={handlePublish}
                                isLoading={publishing}
                                leftIcon={scheduledAt ? <Calendar size={16} /> : <Send size={16} />}
                                className="flex-1"
                            >
                                {scheduledAt ? "Programmer" : `Publier sur ${selectedPlatforms.length} plateforme(s)`}
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Sidebar — Accounts & History */}
                <div className="space-y-4">
                    {/* Connected Accounts */}
                    <Card>
                        <h3 className="font-semibold text-surface-900 dark:text-white mb-3">Comptes connectes</h3>
                        <div className="space-y-2">
                            {PLATFORMS.map(p => {
                                const account = accounts.find(a => a.platform === p.id);
                                const connected = account?.is_connected;
                                const Icon = p.icon;
                                return (
                                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-lg ${p.color} flex items-center justify-center`}>
                                                <Icon size={14} className="text-white" />
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-surface-900 dark:text-white">{p.label}</span>
                                                {account?.account_name && (
                                                    <p className="text-xs text-surface-400">{account.account_name}</p>
                                                )}
                                            </div>
                                        </div>
                                        {connected ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-green-500 flex items-center gap-1">
                                                    <CheckCircle2 size={12} /> Connecte
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDisconnect(p.id)}
                                                    disabled={disconnecting === p.id}
                                                    className="text-xs font-medium text-red-400 hover:text-red-500 transition-colors disabled:opacity-50 flex items-center gap-1"
                                                    title="Déconnecter ce compte"
                                                >
                                                    {disconnecting === p.id
                                                        ? <Loader2 size={12} className="animate-spin" />
                                                        : <Trash2 size={12} />
                                                    }
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setConnectingPlatform(p.id)}
                                                className="text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
                                            >
                                                Connecter
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Connection Modal */}
                    {connectingPlatform && (
                        <Card>
                            <h3 className="font-semibold text-surface-900 dark:text-white mb-3">
                                Connecter {PLATFORMS.find(p => p.id === connectingPlatform)?.label}
                            </h3>
                            <div className="space-y-3">
                                <Input
                                    label="Nom du compte"
                                    placeholder="@mon_restaurant"
                                    value={connectForm.account_name}
                                    onChange={(e) => setConnectForm(prev => ({ ...prev, account_name: e.target.value }))}
                                />
                                {(connectingPlatform === "telegram") && (
                                    <>
                                        <Input
                                            label="Bot Token"
                                            placeholder="123456:ABC-DEF..."
                                            value={connectForm.access_token}
                                            onChange={(e) => setConnectForm(prev => ({ ...prev, access_token: e.target.value }))}
                                        />
                                        <Input
                                            label="Chat ID / Channel ID"
                                            placeholder="-1001234567890"
                                            value={connectForm.chat_id}
                                            onChange={(e) => setConnectForm(prev => ({ ...prev, chat_id: e.target.value }))}
                                        />
                                    </>
                                )}
                                {(connectingPlatform === "facebook" || connectingPlatform === "instagram") && (
                                    <>
                                        <Input
                                            label="Page Access Token"
                                            placeholder="EAA..."
                                            value={connectForm.access_token}
                                            onChange={(e) => setConnectForm(prev => ({ ...prev, access_token: e.target.value }))}
                                        />
                                        <Input
                                            label={connectingPlatform === "instagram" ? "Instagram Business Account ID" : "Page ID"}
                                            placeholder="123456789"
                                            value={connectForm.page_id}
                                            onChange={(e) => setConnectForm(prev => ({ ...prev, page_id: e.target.value }))}
                                        />
                                    </>
                                )}
                                {(connectingPlatform === "whatsapp") && (
                                    <Input
                                        label="Access Token (WhatsApp Cloud API)"
                                        placeholder="EAA..."
                                        value={connectForm.access_token}
                                        onChange={(e) => setConnectForm(prev => ({ ...prev, access_token: e.target.value }))}
                                    />
                                )}
                                {(connectingPlatform === "tiktok") && (
                                    <p className="text-xs text-surface-400">
                                        La publication TikTok automatique necessite l'API Content Posting.
                                        Connectez votre compte pour generer du contenu adapte que vous posterez manuellement.
                                    </p>
                                )}
                                <div className="flex gap-2">
                                    <Button onClick={handleConnect} className="flex-1">Connecter</Button>
                                    <Button variant="outline" onClick={() => setConnectingPlatform(null)}>Annuler</Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Recent Posts */}
                    <Card>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-surface-900 dark:text-white">Historique</h3>
                            <button type="button" onClick={fetchData} className="text-surface-400 hover:text-surface-600 transition-colors">
                                <RefreshCw size={14} />
                            </button>
                        </div>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 size={24} className="animate-spin text-surface-400" />
                            </div>
                        ) : posts.length === 0 ? (
                            <p className="text-sm text-surface-400 text-center py-6">Aucune publication encore</p>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {posts.slice(0, 20).map(post => {
                                    const platformInfo = PLATFORMS.find(p => p.id === post.platform);
                                    const statusInfo = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.draft;
                                    const StatusIcon = statusInfo.icon;
                                    const PlatformIcon = platformInfo?.icon ?? MessageCircle;
                                    const MANUAL_PLATFORMS = ["tiktok", "whatsapp"];
                                    const isManualOnly = MANUAL_PLATFORMS.includes(post.platform);
                                    const canRetry = (post.status === "failed" || post.status === "draft") && !isManualOnly;
                                    return (
                                        <div key={post.id} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                                            <div className="flex items-center gap-2 mb-1">
                                                <PlatformIcon size={12} className={platformInfo?.textColor} />
                                                <span className="text-xs font-medium text-surface-500">{platformInfo?.label}</span>
                                                <span className={`ml-auto flex items-center gap-1 text-xs ${statusInfo.color}`}>
                                                    <StatusIcon size={10} className={post.status === "publishing" ? "animate-spin" : ""} />
                                                    {statusInfo.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-surface-600 dark:text-surface-400 line-clamp-2">
                                                {post.content}
                                            </p>
                                            {post.error_message && (
                                                <p className="text-[10px] text-red-400 mt-1">{post.error_message}</p>
                                            )}
                                            <div className="flex items-center justify-between mt-2">
                                                <p className="text-[10px] text-surface-400">
                                                    {new Date(post.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                                <div className="flex items-center gap-1.5">
                                                    {canRetry && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRetry(post)}
                                                            disabled={retrying === post.id}
                                                            title="Relancer la publication"
                                                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                                                        >
                                                            {retrying === post.id
                                                                ? <Loader2 size={10} className="animate-spin" />
                                                                : <RotateCcw size={10} />
                                                            }
                                                            Relancer
                                                        </button>
                                                    )}
                                                    {isManualOnly && (post.status === "failed" || post.status === "draft") && (
                                                        <button
                                                            type="button"
                                                            onClick={() => copyContent(post.content)}
                                                            title="Copier le contenu pour poster manuellement"
                                                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-surface-500 dark:text-surface-400 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                                                        >
                                                            <Copy size={10} />
                                                            Copier
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => loadIntoCompose(post)}
                                                        title="Modifier et republier"
                                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors"
                                                    >
                                                        <Pencil size={10} />
                                                        Modifier
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function SocialPublisherPage() {
    const { isPremium, loading } = usePremiumCheck();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-surface-400" />
            </div>
        );
    }

    if (!isPremium) {
        return <PremiumUpgradeCard feature="Social Publisher" />;
    }

    return <SocialPublisherContent />;
}
