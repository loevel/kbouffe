"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, ShoppingBag, TrendingUp, Calendar, ExternalLink, UserCircle, Star, Save, Tag, AlertCircle } from "lucide-react";
import { Card, Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Spinner, EmptyState, Input, Textarea, Select, toast } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { formatCFA, formatDate, formatPhone, formatOrderId } from "@kbouffe/module-core/ui";

interface CustomerDetail {
    id: string;
    profile: {
        name: string;
        email: string | null;
        phone: string | null;
        avatarUrl: string | null;
        joinedAt: string;
    };
    stats: {
        totalSpent: number;
        ordersCount: number;
        lastOrderAt: string;
        avgOrderValue: number;
        topProducts: { name: string, count: number }[];
    };
    segment: string;
    internalNotes: string | null;
    tags: string[];
    orders: any[];
}

export default function CustomerDetailPage() {
    const { t } = useLocale();
    const router = useRouter();
    const params = useParams();
    const customerId = decodeURIComponent(params.id as string);

    const [data, setData] = useState<CustomerDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [segment, setSegment] = useState("regular");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const res = await fetch(`/api/customers/${customerId}`, { cache: "no-store" });
                if (!res.ok) throw new Error("API error");
                const json = await res.json();
                setData(json);
                setSegment(json.segment || "regular");
                setNotes(json.internalNotes || "");
            } catch (err) {
                console.error(err);
                toast.error("Erreur lors du chargement du client");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [customerId]);

    const handleSaveInfo = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/customers/${customerId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ segment, internalNotes: notes }),
            });
            if (res.ok) {
                toast.success("Informations client enregistrées");
            } else {
                toast.error("Échec de l'enregistrement");
            }
        } catch {
            toast.error("Erreur réseau");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <Spinner size="lg" />
        </div>
    );

    if (!data) return (
        <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
                <ArrowLeft size={16} /> {t.customers.backToCustomers}
            </Button>
            <EmptyState title="Client introuvable" description="" />
        </div>
    );

    const { profile, stats, orders } = data;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/customers")} className="gap-2 -ml-2">
                        <ArrowLeft size={16} /> {t.customers.backToCustomers}
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 text-2xl font-black">
                            {profile.name?.charAt(0) || "U"}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-surface-900 dark:text-white uppercase tracking-tight">
                                    {profile.name || "Client"}
                                </h1>
                                <Badge variant={segment === "vip" ? "brand" : segment === "blocked" ? "danger" : "default"} className="uppercase font-black text-[10px] tracking-widest px-2.5">
                                    {segment}
                                </Badge>
                            </div>
                            <p className="text-surface-500 font-medium">Client depuis le {new Date(profile.joinedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 font-bold uppercase text-[10px] tracking-widest h-11 px-6">
                        <Phone size={14} /> Contacter
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Statistics & Profile Cards */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="flex flex-col gap-4 border-none bg-surface-900 text-white p-6 shadow-xl">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <TrendingUp size={20} className="text-brand-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1">Valeur Totale (LTV)</p>
                                <p className="text-2xl font-black tabular-nums tracking-tight">{formatCFA(stats.totalSpent)}</p>
                            </div>
                        </Card>
                        <Card className="flex flex-col gap-4 p-6">
                            <div className="w-10 h-10 rounded-xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center">
                                <ShoppingBag size={20} className="text-brand-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1">Commandes</p>
                                <p className="text-2xl font-black tabular-nums tracking-tight text-surface-900 dark:text-white">{stats.ordersCount}</p>
                            </div>
                        </Card>
                        <Card className="flex flex-col gap-4 p-6">
                            <div className="w-10 h-10 rounded-xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center">
                                <Star size={20} className="text-amber-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1">Panier Moyen</p>
                                <p className="text-2xl font-black tabular-nums tracking-tight text-surface-900 dark:text-white">{formatCFA(stats.avgOrderValue)}</p>
                            </div>
                        </Card>
                    </div>

                    <Card padding="none" className="overflow-hidden">
                        <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-surface-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <History size={16} className="text-brand-500" /> Historique Récent
                            </h3>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-[10px] uppercase font-black">Commande</TableHead>
                                    <TableHead className="text-[10px] uppercase font-black">Date</TableHead>
                                    <TableHead className="text-[10px] uppercase font-black">Status</TableHead>
                                    <TableHead className="text-right text-[10px] uppercase font-black">Montant</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id} className="group">
                                        <TableCell className="font-mono text-xs font-bold text-surface-900 dark:text-white">
                                            <Link href={`/dashboard/orders/${order.id}`} className="hover:text-brand-500 transition-colors">
                                                #{order.id.slice(0, 8)}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-surface-500">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={order.status === 'completed' ? 'success' : 'default'} className="text-[9px] uppercase font-bold">
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-black text-sm text-surface-900 dark:text-white">{formatCFA(order.total)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>

                {/* Right Sidebar: Notes & CRM */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-surface-400">Gouvernance CRM</h3>
                        
                        <div className="space-y-4">
                            <Select 
                                label="Segmentation"
                                value={segment}
                                onChange={(e) => setSegment(e.target.value)}
                                options={[
                                    { value: "new", label: "Nouveau Client" },
                                    { value: "regular", label: "Habitué" },
                                    { value: "vip", label: "Client VIP" },
                                    { value: "blocked", label: "Client Bloqué" },
                                ]}
                            />

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Note Interne</label>
                                <Textarea 
                                    placeholder="Ajoutez des notes sur les préférences du client (ex: aime le piment, allergies, adresse difficile à trouver...)"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={5}
                                    className="bg-surface-50 dark:bg-surface-800 border-none rounded-xl text-sm"
                                />
                            </div>

                            <Button 
                                className="w-full h-12 font-black uppercase text-[10px] tracking-[0.2em]" 
                                leftIcon={<Save size={16} />}
                                onClick={handleSaveInfo}
                                isLoading={saving}
                            >
                                Mettre à jour la fiche
                            </Button>
                        </div>
                    </Card>

                    <Card className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-surface-400">Habitudes de Consommation</h3>
                        <div className="space-y-3">
                            {stats.topProducts.map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                                    <span className="text-sm font-bold text-surface-900 dark:text-white truncate max-w-[150px]">{p.name}</span>
                                    <Badge variant="outline" className="text-[10px] font-black">{p.count} fois</Badge>
                                </div>
                            ))}
                            {stats.topProducts.length === 0 && (
                                <p className="text-xs text-surface-400 italic text-center py-4">Pas encore assez de données</p>
                            )}
                        </div>
                    </Card>

                    {segment === "blocked" && (
                        <div className="p-4 rounded-2xl bg-danger-50 dark:bg-danger-900/10 border border-danger-200 dark:border-danger-800 flex items-start gap-3">
                            <AlertCircle className="text-danger-500 shrink-0" size={18} />
                            <div>
                                <p className="text-sm font-bold text-danger-600 dark:text-danger-400">Client Restreint</p>
                                <p className="text-xs text-danger-500 leading-relaxed">Les commandes de ce client sont automatiquement signalées comme suspectes.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Missing History and Trash icon imports handled by using lucide names manually or assuming they are in the bundle.
import { History } from "lucide-react";
