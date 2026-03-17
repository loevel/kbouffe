"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import { Topbar } from "./Topbar";
import { DashboardProvider } from "../../contexts/DashboardContext";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { LocaleProvider } from "../../contexts/LocaleContext";

interface DashboardShellProps {
    children: ReactNode;
    pendingOrderCount?: number;
}

export function DashboardShell({ children, pendingOrderCount = 0 }: DashboardShellProps) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <ThemeProvider>
            <LocaleProvider>
                <DashboardProvider>
                    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100">
                        <Sidebar pendingOrderCount={pendingOrderCount} />
                        <MobileSidebar
                            isOpen={isMobileSidebarOpen}
                            onClose={() => setIsMobileSidebarOpen(false)}
                            pendingOrderCount={pendingOrderCount}
                        />
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <Topbar onMenuClick={() => setIsMobileSidebarOpen(true)} />
                            <main className="flex-1 overflow-y-auto">
                                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                                    {children}
                                </div>
                            </main>
                        </div>
                    </div>
                </DashboardProvider>
            </LocaleProvider>
        </ThemeProvider>
    );
}
