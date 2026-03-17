import type { Metadata } from "next";
import { DashboardShellWrapper } from "@/components/dashboard/DashboardShellWrapper";

export const metadata: Metadata = {
    title: "Tableau de bord — Kbouffe",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <DashboardShellWrapper>{children}</DashboardShellWrapper>;
}
