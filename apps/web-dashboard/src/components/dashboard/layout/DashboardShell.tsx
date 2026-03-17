"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import { Topbar } from "./Topbar";
import { DashboardProvider } from "@/contexts/dashboard-context";

export function DashboardShell({ children }: { children: ReactNode }) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <DashboardProvider>
            <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <MobileSidebar
                    isOpen={isMobileSidebarOpen}
                    onClose={() => setIsMobileSidebarOpen(false)}
                />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Topbar onMenuClick={() => setIsMobileSidebarOpen(true)} />
                    <main className="flex-1 overflow-y-auto bg-surface-50 dark:bg-surface-950">
                        <div className="p-6 lg:p-8 max-w-7xl">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </DashboardProvider>
    );
}
