"use client";

import { UserCheck, UserX, RefreshCw } from "lucide-react";
import { usePosOperator } from "@/contexts/PosOperatorContext";
import { PinEntryModal } from "./PinEntryModal";

// ── Role display labels (French) ─────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
    owner: "Propriétaire",
    manager: "Gérant",
    cashier: "Caissier",
    cook: "Cuisinier",
    viewer: "Observateur",
    driver: "Livreur",
};

// ── Component ────────────────────────────────────────────────────────────────

export function OperatorBar() {
    const { operator, setOperator, openPinEntry } = usePosOperator();

    const roleLabel = operator
        ? (ROLE_LABELS[operator.role] ?? operator.role)
        : null;

    return (
        <>
            {operator ? (
                /* Operator identified */
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm">
                    <UserCheck size={15} className="text-green-600 dark:text-green-400 shrink-0" />
                    <span className="font-medium text-green-800 dark:text-green-300 truncate">
                        {operator.name}
                    </span>
                    <span className="text-green-600 dark:text-green-500 text-xs hidden sm:inline">
                        ({roleLabel})
                    </span>
                    <div className="flex items-center gap-1 ml-auto shrink-0">
                        {/* Change operator */}
                        <button
                            onClick={openPinEntry}
                            title="Changer d'opérateur"
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800/40 transition-colors"
                        >
                            <RefreshCw size={12} />
                            <span className="hidden sm:inline">Changer</span>
                        </button>
                        {/* Sign out */}
                        <button
                            onClick={() => setOperator(null)}
                            title="Déconnecter l'opérateur"
                            className="p-0.5 rounded-lg text-green-600 dark:text-green-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <UserX size={14} />
                        </button>
                    </div>
                </div>
            ) : (
                /* No operator — tap to identify */
                <button
                    onClick={openPinEntry}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                >
                    <UserX size={15} className="shrink-0" />
                    <span>Aucun opérateur — Appuyez pour s'identifier</span>
                </button>
            )}

            {/* PIN entry modal — rendered here so it overlays the whole page */}
            <PinEntryModal />
        </>
    );
}
