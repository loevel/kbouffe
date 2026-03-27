import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import {
    getSupportTickets,
    createSupportTicket as apiCreateSupportTicket,
} from '@/lib/api';
import { useAuth } from './auth-context';

export type SupportTicketType = 'question' | 'incident' | 'refund';
export type SupportTicketStatus = 'open' | 'in_review' | 'waiting_customer' | 'resolved' | 'closed';

export interface SupportTicket {
    id: string;
    type: SupportTicketType;
    status: SupportTicketStatus;
    subject: string;
    description: string;
    orderId?: string;
    createdAt: string;
}

export interface FaqItem {
    id: string;
    question: string;
    answer: string;
    tags: string[];
}

interface SupportContextType {
    tickets: SupportTicket[];
    faq: FaqItem[];
    loading: boolean;
    createTicket: (params: { type?: SupportTicketType; subject: string; description: string; orderId?: string; reporterType?: string }) => Promise<void>;
    getTicketById: (id: string) => SupportTicket | undefined;
    getTicketsByOrderId: (orderId: string) => SupportTicket[];
    refreshTickets: () => Promise<void>;
}

const DEFAULT_FAQ: FaqItem[] = [
    {
        id: 'faq-delivery-delay',
        question: 'Ma livraison est en retard, que faire ?',
        answer: 'Contactez directement le restaurant via le bouton “Appeler” sur votre suivi de commande. Le restaurant gère sa propre logistique de livraison.',
        tags: ['livraison', 'retard', 'restaurant'],
    },
    {
        id: 'faq-refund',
        question: 'Comment demander un remboursement ?',
        answer: 'Les remboursements sont gérés par le restaurateur. Contactez l’établissement pour convenir d’un geste commercial ou d’un remboursement.',
        tags: ['remboursement', 'litige', 'paiement'],
    },
    {
        id: 'faq-order-issue',
        question: 'Un article est manquant ou non conforme ?',
        answer: 'Signalez-le immédiatement au restaurant. En tant que plateforme technique, Kbouffe ne prépare pas les repas.',
        tags: ['qualité', 'erreur', 'plat'],
    },
    {
        id: 'faq-promo',
        question: 'Pourquoi mon code promo ne fonctionne pas ?',
        answer: 'Vérifiez les conditions fixées par le restaurant (date, montant minimum, etc.) dans l’écran de votre panier.',
        tags: ['promo', 'code', 'réduction'],
    },
];

const SupportContext = createContext<SupportContextType | null>(null);

export function SupportProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(false);

    const refreshTickets = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const data = await getSupportTickets();
            const mapped: SupportTicket[] = data.map(t => ({
                id: t.id,
                type: 'question',
                status: (t.status as SupportTicketStatus) || 'open',
                subject: t.subject,
                description: t.description,
                orderId: t.order_id,
                createdAt: t.createdAt
            }));
            setTickets(mapped);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        refreshTickets();
    }, [refreshTickets]);

    const createTicket = useCallback(async (params: { type?: SupportTicketType; subject: string; description: string; orderId?: string; reporterType?: string }) => {
        setLoading(true);
        try {
            await apiCreateSupportTicket(params);
            await refreshTickets();
        } catch (error) {
            console.error('Error creating ticket:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [refreshTickets]);

    const getTicketById = useCallback((id: string) => tickets.find((ticket) => ticket.id === id), [tickets]);

    const getTicketsByOrderId = useCallback((orderId: string) => {
        return tickets.filter((ticket) => ticket.orderId === orderId);
    }, [tickets]);

    const value = useMemo<SupportContextType>(() => ({
        tickets,
        faq: DEFAULT_FAQ,
        loading,
        createTicket,
        getTicketById,
        getTicketsByOrderId,
        refreshTickets,
    }), [tickets, loading, createTicket, getTicketById, getTicketsByOrderId, refreshTickets]);

    return <SupportContext.Provider value={value}>{children}</SupportContext.Provider>;
}

export function useSupport() {
    const ctx = useContext(SupportContext);
    if (!ctx) throw new Error('useSupport must be used within SupportProvider');
    return ctx;
}
