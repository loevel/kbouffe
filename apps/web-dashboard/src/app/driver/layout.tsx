import type { Metadata } from "next";
import { DriverShell } from "@/components/driver/DriverShell";

export const metadata: Metadata = {
    title: "Espace Livreur — Kbouffe",
};

export default function DriverLayout({ children }: { children: React.ReactNode }) {
    return <DriverShell>{children}</DriverShell>;
}
