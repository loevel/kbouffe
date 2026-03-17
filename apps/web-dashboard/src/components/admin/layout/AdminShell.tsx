"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminMobileSidebar } from "./AdminMobileSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { AdminProvider } from "@/components/providers/AdminProvider";

export function AdminShell({ children }: { children: ReactNode }) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const pathname = usePathname();

    // Do not render the dashboard shell for the login page
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    return (
        <AdminProvider>
            <div className="flex h-screen overflow-hidden">
                <AdminSidebar />
                <AdminMobileSidebar
                    isOpen={isMobileSidebarOpen}
                    onClose={() => setIsMobileSidebarOpen(false)}
                />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <AdminTopbar onMenuClick={() => setIsMobileSidebarOpen(true)} />
                    <main className="flex-1 overflow-y-auto bg-surface-50 dark:bg-surface-950">
                        <div className="p-6 lg:p-8 max-w-7xl">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </AdminProvider>
    );
}
