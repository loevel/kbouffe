"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import { BottomNavBar } from "./BottomNavBar";
import { Topbar } from "./Topbar";
import { DashboardProvider } from "../../contexts/DashboardContext";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { LocaleProvider } from "../../contexts/LocaleContext";

interface DashboardShellProps {
    children: ReactNode;
    pendingOrderCount?: number;
    badgeCounts?: Record<string, number>;
    searchSlot?: ReactNode;
    helpOpen?: boolean;
    onHelpOpen?: () => void;
}

export function DashboardShell({ children, pendingOrderCount = 0, badgeCounts = {}, searchSlot, helpOpen = false, onHelpOpen }: DashboardShellProps) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <ThemeProvider>
            <LocaleProvider>
                <DashboardProvider>
                    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100">
                        {/* ── Sidebar desktop (hidden < lg) ── */}
                        <Sidebar pendingOrderCount={pendingOrderCount} badgeCounts={badgeCounts} />

                        {/* ── Drawer mobile animé (toujours monté) ── */}
                        <MobileSidebar
                            isOpen={isMobileSidebarOpen}
                            onClose={() => setIsMobileSidebarOpen(false)}
                            pendingOrderCount={pendingOrderCount}
                            badgeCounts={badgeCounts}
                        />

                        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                            <Topbar onMenuClick={() => setIsMobileSidebarOpen(true)} searchSlot={searchSlot} onHelpOpen={onHelpOpen} />

                            <main className="flex-1 overflow-y-auto">
                                {/*
                                 * Padding adaptatif :
                                 *   - Mobile  : p-4 + pb-24 (espace pour la BottomNavBar)
                                 *   - Desktop : p-6 lg:p-8
                                 */}
                                <div className="p-4 pb-24 sm:p-6 sm:pb-6 lg:p-8 max-w-7xl mx-auto">
                                    {children}
                                </div>
                            </main>
                        </div>

                        {/* ── Bottom navigation bar (mobile uniquement) ── */}
                        <BottomNavBar pendingOrderCount={pendingOrderCount} />
                    </div>
                </DashboardProvider>
            </LocaleProvider>
        </ThemeProvider>
    );
}
