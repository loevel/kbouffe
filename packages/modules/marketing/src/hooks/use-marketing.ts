"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { authFetch } from "@kbouffe/module-core/ui";
import type { Coupon, AdCampaign } from "../lib/types";

// ── Fetcher ───────────────────────────────────────────────────────────────

async function fetcher<T>(url: string): Promise<T> {
  const res = await authFetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `API error ${res.status}`);
  }
  return res.json();
}

// ── Coupons ───────────────────────────────────────────────────────────────────

interface CouponsResponse {
  coupons: Coupon[];
  total: number;
}

export function useCoupons() {
  const { data, error, isLoading, mutate } = useSWR<CouponsResponse>(
    "/api/coupons",
    fetcher,
    { fallbackData: { coupons: [], total: 0 } }
  );

  async function createCoupon(body: Partial<Coupon>) {
    const res = await authFetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Erreur création coupon");
    }
    await mutate();
    return res.json();
  }

  async function updateCoupon(id: string, body: Partial<Coupon>) {
    const res = await authFetch(`/api/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Erreur mise à jour coupon");
    }
    await mutate();
    return res.json();
  }

  async function deleteCoupon(id: string) {
    const res = await authFetch(`/api/coupons/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Erreur suppression coupon");
    }
    await mutate();
  }

  return {
    coupons: data?.coupons ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    mutate,
  };
}

// ── Ad Campaigns ──────────────────────────────────────────────────────────────

interface CampaignsResponse {
  campaigns: AdCampaign[];
  activeCampaign: AdCampaign | null;
  total: number;
}

export function useCampaigns() {
  const { data, error, isLoading, mutate } = useSWR<CampaignsResponse>(
    "/api/marketing/campaigns",
    fetcher,
    { fallbackData: { campaigns: [], activeCampaign: null, total: 0 } }
  );

  async function createCampaign(body: {
    package: "basic" | "premium" | "elite";
    starts_at?: string;
    include_push?: boolean;
    push_message?: string;
    notes?: string;
  }) {
    const res = await authFetch("/api/marketing/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Erreur création campagne");
    }
    await mutate();
    return res.json();
  }

  async function cancelCampaign(id: string) {
    const res = await authFetch(`/api/marketing/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Erreur annulation campagne");
    }
    await mutate();
  }

  return {
    campaigns: data?.campaigns ?? [],
    activeCampaign: data?.activeCampaign ?? null,
    total: data?.total ?? 0,
    isLoading,
    error,
    createCampaign,
    cancelCampaign,
    mutate,
  };
}
