"use client";

/**
 * SupplierContext — partagé avec toutes les pages du dashboard fournisseur.
 *
 * Fournit :
 *   - supplier  : profil fournisseur (null si non trouvé)
 *   - loading   : true pendant le chargement initial
 *   - refresh() : recharge le profil depuis l'API
 *
 * Consommation :
 *   import { useSupplier } from "@/app/dashboard/fournisseur/SupplierContext";
 *   const { supplier, loading, refresh } = useSupplier();
 */

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { authFetch } from "@kbouffe/module-core/ui";

// ── Types ──────────────────────────────────────────────────────────────────

export interface SupplierProfile {
    id: string;
    name: string;
    type: "individual_farmer" | "cooperative" | "wholesaler";
    contact_name: string;
    phone: string;
    email: string | null;
    description: string | null;
    logo_url: string | null;
    region: string;
    locality: string;
    address: string | null;
    identity_doc_url: string | null;
    rccm: string | null;
    nif: string | null;
    minader_cert_url: string | null;
    cooperative_number: string | null;
    kyc_status: "pending" | "approved" | "rejected" | "suspended" | "documents_submitted";
    kyc_rejection_reason: string | null;
    listing_tier: "free" | "basic" | "premium";
    is_active: boolean;
    is_featured: boolean;
    product_count?: number;
    created_at: string;
    updated_at: string;
}

interface SupplierContextValue {
    supplier: SupplierProfile | null;
    loading: boolean;
    refresh: () => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────────────────

const SupplierContext = createContext<SupplierContextValue>({
    supplier: null,
    loading: true,
    refresh: async () => {},
});

export function useSupplier() {
    return useContext(SupplierContext);
}

// ── Provider ───────────────────────────────────────────────────────────────

export function SupplierProvider({ children }: { children: ReactNode }) {
    const router = useRouter();

    const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSupplier = useCallback(async () => {
        try {
            // 1. Verify Supabase session
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
                router.replace("/login");
                return;
            }

            // 2. Fetch supplier profile
            const res = await authFetch("/api/marketplace/suppliers/me");

            if (res.status === 404) {
                // User authenticated but no supplier profile — redirect to registration
                router.replace("/register/fournisseur");
                return;
            }

            if (!res.ok) {
                console.error("Supplier fetch error:", res.status);
                setSupplier(null);
                return;
            }

            const data = (await res.json()) as { supplier?: SupplierProfile } | SupplierProfile;
            // API may return { supplier: {...} } or the object directly
            const profile =
                "supplier" in data ? (data as { supplier: SupplierProfile }).supplier : data;

            setSupplier(profile as SupplierProfile);
        } catch (err) {
            console.error("SupplierContext fetchSupplier:", err);
            setSupplier(null);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchSupplier();
    }, [fetchSupplier]);

    return (
        <SupplierContext.Provider
            value={{ supplier, loading, refresh: fetchSupplier }}
        >
            {children}
        </SupplierContext.Provider>
    );
}
