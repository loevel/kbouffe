"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@kbouffe/module-core/ui";
import { DashboardCustomer } from "./types";

export function useCustomers() {
    const [customers, setCustomers] = useState<DashboardCustomer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let active = true;

        async function loadCustomers() {
            setIsLoading(true);
            try {
                const response = await authFetch("/api/customers?limit=200");
                if (!response.ok) throw new Error("API customers indisponible");

                const data = await response.json() as any;
                if (!active) return;

                const rows = Array.isArray(data.customers) ? data.customers : [];
                setCustomers(rows);
            } catch (err) {
                if (!active) return;
                setError(err instanceof Error ? err : new Error("Unknown error"));
                setCustomers([]);
            } finally {
                if (active) setIsLoading(false);
            }
        }

        loadCustomers();

        return () => {
            active = false;
        };
    }, []);

    return { customers, isLoading, error };
}
