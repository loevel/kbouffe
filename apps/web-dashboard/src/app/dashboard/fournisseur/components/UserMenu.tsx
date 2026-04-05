"use client";

/**
 * UserMenu -- Dropdown (desktop) / fullscreen (mobile) menu for supplier.
 *
 * Options:
 *   - Mon profil       -> /dashboard/fournisseur/profil
 *   - Parametres       -> /dashboard/fournisseur/securite
 *   - Aide & docs      -> opens help modal
 *   - Deconnexion      -> logout + redirect /login
 *
 * Features:
 *   - Keyboard nav (Tab, Enter, Escape)
 *   - Click outside to close
 *   - Dark mode compatible
 *   - Avatar with initials fallback
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Settings,
    HelpCircle,
    LogOut,
    ChevronDown,
    X,
    ExternalLink,
    BookOpen,
    MessageCircle,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useSupplier } from "../SupplierContext";

// ── Help Modal ─────────────────────────────────────────────────────────────

function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        if (open) {
            document.addEventListener("keydown", handleKeyDown);
            // Trap focus
            modalRef.current?.focus();
        }
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    const helpLinks = [
        {
            icon: BookOpen,
            label: "Guide de demarrage",
            description: "Premiers pas pour vendre sur KBouffe",
            href: "#",
        },
        {
            icon: HelpCircle,
            label: "FAQ Fournisseur",
            description: "Questions frequentes et reponses",
            href: "#",
        },
        {
            icon: MessageCircle,
            label: "Contacter le support",
            description: "Envoyez un message a notre equipe",
            href: "/dashboard/fournisseur/messages",
        },
    ];

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/60"
                        onClick={onClose}
                        aria-hidden="true"
                    />
                    {/* Modal */}
                    <motion.div
                        ref={modalRef}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-x-4 top-[20%] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[61] w-auto sm:w-full sm:max-w-md rounded-2xl bg-surface-900 border border-white/10 shadow-2xl shadow-black/50 p-6"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Aide et documentation"
                        tabIndex={-1}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-white">
                                Aide & Documentation
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-white/8 transition-colors"
                                aria-label="Fermer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {helpLinks.map((item) => {
                                const Icon = item.icon;
                                const isExternal = item.href.startsWith("http");
                                const Component = item.href === "#" ? "button" : Link;
                                const props =
                                    item.href === "#"
                                        ? { onClick: onClose, type: "button" as const }
                                        : { href: item.href, onClick: onClose };

                                return (
                                    <Component
                                        key={item.label}
                                        {...(props as any)}
                                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center shrink-0">
                                            <Icon
                                                size={17}
                                                className="text-emerald-400"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                                                {item.label}
                                            </p>
                                            <p className="text-xs text-surface-500 mt-0.5">
                                                {item.description}
                                            </p>
                                        </div>
                                        {isExternal && (
                                            <ExternalLink
                                                size={14}
                                                className="text-surface-600 shrink-0"
                                            />
                                        )}
                                    </Component>
                                );
                            })}
                        </div>

                        <div className="mt-5 pt-4 border-t border-white/8">
                            <p className="text-xs text-surface-600 text-center">
                                Support disponible du lundi au vendredi, 8h-18h (UTC+1)
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ── Avatar ──────────────────────────────────────────────────────────────────

function SupplierAvatar({
    name,
    logoUrl,
    size = "md",
}: {
    name: string;
    logoUrl?: string | null;
    size?: "sm" | "md";
}) {
    const initials = name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const sizeClass = size === "sm" ? "w-7 h-7 text-[10px]" : "w-8 h-8 text-xs";

    if (logoUrl) {
        return (
            <img
                src={logoUrl}
                alt={name}
                className={`${sizeClass} rounded-full object-cover border border-white/10`}
            />
        );
    }

    return (
        <div
            className={`${sizeClass} rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400`}
        >
            {initials}
        </div>
    );
}

// ── Menu items ──────────────────────────────────────────────────────────────

interface MenuItem {
    id: string;
    icon: React.ElementType;
    label: string;
    href?: string;
    action?: "help" | "logout";
    color?: string;
}

const MENU_ITEMS: MenuItem[] = [
    {
        id: "profile",
        icon: User,
        label: "Mon profil",
        href: "/dashboard/fournisseur/profil",
    },
    {
        id: "settings",
        icon: Settings,
        label: "Parametres",
        href: "/dashboard/fournisseur/securite",
    },
    {
        id: "help",
        icon: HelpCircle,
        label: "Aide & documentation",
        action: "help",
    },
    {
        id: "logout",
        icon: LogOut,
        label: "Deconnexion",
        action: "logout",
        color: "text-red-400 hover:text-red-300",
    },
];

// ── UserMenu Component ──────────────────────────────────────────────────────

export function UserMenu() {
    const { supplier } = useSupplier();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [focusedIndex, setFocusedIndex] = useState(-1);

    const supplierName = supplier?.name ?? "Fournisseur";
    const contactName = supplier?.contact_name ?? "";

    // ── Close on click outside ─────────────────────────────────────────
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
                setFocusedIndex(-1);
            }
        }
        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    // ── Keyboard navigation ────────────────────────────────────────────
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!open) {
                if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
                    e.preventDefault();
                    setOpen(true);
                    setFocusedIndex(0);
                }
                return;
            }

            switch (e.key) {
                case "Escape":
                    e.preventDefault();
                    setOpen(false);
                    setFocusedIndex(-1);
                    triggerRef.current?.focus();
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    setFocusedIndex((prev) =>
                        prev < MENU_ITEMS.length - 1 ? prev + 1 : 0
                    );
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setFocusedIndex((prev) =>
                        prev > 0 ? prev - 1 : MENU_ITEMS.length - 1
                    );
                    break;
                case "Tab":
                    setOpen(false);
                    setFocusedIndex(-1);
                    break;
                case "Enter":
                case " ":
                    e.preventDefault();
                    if (focusedIndex >= 0) {
                        handleItemClick(MENU_ITEMS[focusedIndex]);
                    }
                    break;
            }
        },
        [open, focusedIndex]
    );

    // ── Logout ─────────────────────────────────────────────────────────
    async function handleLogout() {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        await supabase.auth.signOut();
        router.replace("/login");
    }

    // ── Item click handler ─────────────────────────────────────────────
    function handleItemClick(item: MenuItem) {
        setOpen(false);
        setFocusedIndex(-1);

        if (item.action === "help") {
            setHelpOpen(true);
        } else if (item.action === "logout") {
            handleLogout();
        } else if (item.href) {
            router.push(item.href);
        }
    }

    return (
        <>
            <div className="relative" onKeyDown={handleKeyDown}>
                {/* Trigger */}
                <button
                    ref={triggerRef}
                    onClick={() => {
                        setOpen((prev) => !prev);
                        setFocusedIndex(-1);
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/8 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                    aria-label="Menu utilisateur"
                    aria-expanded={open}
                    aria-haspopup="menu"
                >
                    <SupplierAvatar
                        name={supplierName}
                        logoUrl={supplier?.logo_url}
                    />
                    <span className="hidden sm:block text-sm font-medium text-surface-300 max-w-[120px] truncate">
                        {contactName || supplierName}
                    </span>
                    <ChevronDown
                        size={14}
                        className={`hidden sm:block text-surface-500 transition-transform duration-200 ${
                            open ? "rotate-180" : ""
                        }`}
                    />
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                    {open && (
                        <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-surface-900 border border-white/10 shadow-2xl shadow-black/40 z-50 overflow-hidden"
                            role="menu"
                            aria-label="Menu utilisateur"
                        >
                            {/* User info header */}
                            <div className="px-4 py-3 border-b border-white/8">
                                <div className="flex items-center gap-3">
                                    <SupplierAvatar
                                        name={supplierName}
                                        logoUrl={supplier?.logo_url}
                                        size="md"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-white truncate">
                                            {supplierName}
                                        </p>
                                        {contactName && (
                                            <p className="text-xs text-surface-500 truncate">
                                                {contactName}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Menu items */}
                            <div className="py-1">
                                {MENU_ITEMS.map((item, index) => {
                                    const Icon = item.icon;
                                    const isFocused = focusedIndex === index;
                                    const isLast = item.id === "logout";

                                    return (
                                        <div key={item.id}>
                                            {isLast && (
                                                <div className="my-1 border-t border-white/8" />
                                            )}
                                            <button
                                                onClick={() => handleItemClick(item)}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                                                    item.color ??
                                                    "text-surface-300 hover:text-white"
                                                } ${
                                                    isFocused
                                                        ? "bg-white/8"
                                                        : "hover:bg-white/5"
                                                }`}
                                                role="menuitem"
                                                tabIndex={isFocused ? 0 : -1}
                                                aria-label={item.label}
                                            >
                                                <Icon
                                                    size={16}
                                                    className="shrink-0"
                                                />
                                                <span className="font-medium">
                                                    {item.label}
                                                </span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Help modal */}
            <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
        </>
    );
}
