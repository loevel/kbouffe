"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { authFetch } from "@kbouffe/module-core/ui";
import type { Reservation, ReservationStatus, RestaurantTable, TableZone } from "../lib/types";

async function fetcher<T>(url: string): Promise<T> {
  const res = await authFetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as any) as any;
    throw new Error(body.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

interface ReservationsResponse {
  reservations: Reservation[];
  total: number;
}

export function useReservations(params?: {
  status?: string;
  search?: string;
  date?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.status && params.status !== "all")
    searchParams.set("status", params.status);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.date) searchParams.set("date", params.date);

  const qs = searchParams.toString();
  const key = `/api/reservations${qs ? `?${qs}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<ReservationsResponse>(
    key,
    fetcher
  );

  return {
    reservations: data?.reservations ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export function useReservation(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{
    reservation: Reservation;
  }>(id ? `/api/reservations/${id}` : null, fetcher);

  return {
    reservation: data?.reservation ?? null,
    isLoading,
    error,
    mutate,
  };
}

export async function createReservation(
  body: Partial<Reservation>
): Promise<{ success: boolean; reservation?: Reservation; error?: string }> {
  try {
    const res = await authFetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json() as { reservation: Reservation; error?: string };
    if (!res.ok) return { success: false, error: data.error };

    globalMutate(
      (key: string) =>
        typeof key === "string" && key.startsWith("/api/reservations"),
      undefined,
      { revalidate: true }
    );

    return { success: true, reservation: data.reservation };
  } catch {
    return { success: false, error: "Erreur réseau" };
  }
}

export async function updateReservation(
  id: string,
  body: Partial<Reservation>
): Promise<{ success: boolean; reservation?: Reservation; error?: string }> {
  try {
    const res = await authFetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json() as { reservation: Reservation; error?: string };
    if (!res.ok) return { success: false, error: data.error };

    globalMutate(
      (key: string) =>
        typeof key === "string" && key.startsWith("/api/reservations"),
      undefined,
      { revalidate: true }
    );

    return { success: true, reservation: data.reservation };
  } catch {
    return { success: false, error: "Erreur réseau" };
  }
}

export async function deleteReservation(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await authFetch(`/api/reservations/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}) as any) as { error?: string };
      return { success: false, error: data.error };
    }

    globalMutate(
      (key: string) =>
        typeof key === "string" && key.startsWith("/api/reservations"),
      undefined,
      { revalidate: true }
    );

    return { success: true };
  } catch {
    return { success: false, error: "Erreur réseau" };
  }
}

interface TablesResponse {
  tables: RestaurantTable[];
}

export function useTables() {
  const { data, error, isLoading, mutate } = useSWR<TablesResponse>(
    "/api/tables",
    fetcher
  );

  return {
    tables: data?.tables ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useTableZones() {
  const { data, error, isLoading, mutate } = useSWR<{ zones: TableZone[] }>(
    "/api/tables/zones",
    fetcher
  );

  return {
    zones: data?.zones ?? [],
    isLoading,
    error,
    mutate,
  };
}
