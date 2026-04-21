"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Modal, ModalFooter, Button, useLocale } from "@kbouffe/module-core/ui";
import { ASSIGNABLE_ROLES, type TeamRole, canManageRole } from "../api/permissions";
import { ROLE_LABELS } from "./constants";

interface ManageRolesModalProps {
    isOpen: boolean;
    onClose: () => void;
    memberName: string;
    initialRoles: TeamRole[];
    callerRole: TeamRole;
    onSave: (roles: TeamRole[]) => Promise<void> | void;
}

export function ManageRolesModal({
    isOpen,
    onClose,
    memberName,
    initialRoles,
    callerRole,
    onSave,
}: ManageRolesModalProps) {
    const { locale } = useLocale();
    const lang = locale === "fr" ? "fr" : "en";

    const [selected, setSelected] = useState<TeamRole[]>(initialRoles);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) setSelected(initialRoles);
    }, [isOpen, initialRoles]);

    const assignable = ASSIGNABLE_ROLES.filter((r) => canManageRole(callerRole, r));

    const toggle = (role: TeamRole) => {
        setSelected((prev) =>
            prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
        );
    };

    const handleSave = async () => {
        if (selected.length === 0) return;
        setSaving(true);
        try {
            await onSave(selected);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const title = lang === "fr" ? "Gérer les rôles" : "Manage roles";
    const description =
        lang === "fr"
            ? `Un membre peut cumuler plusieurs rôles. Sélectionnez ceux attribués à ${memberName}.`
            : `A member can hold multiple roles. Select the ones assigned to ${memberName}.`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} description={description}>
            <div className="space-y-2">
                {assignable.map((role) => {
                    const checked = selected.includes(role);
                    return (
                        <label
                            key={role}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                checked
                                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                                    : "border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800"
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggle(role)}
                                className="h-4 w-4 rounded border-surface-300 text-brand-500 focus:ring-brand-500"
                            />
                            <ShieldCheck
                                size={16}
                                className={checked ? "text-brand-500" : "text-surface-400"}
                            />
                            <span className="text-sm font-medium text-surface-900 dark:text-white">
                                {ROLE_LABELS[role][lang]}
                            </span>
                        </label>
                    );
                })}

                {assignable.length === 0 && (
                    <p className="text-sm text-surface-400 py-4 text-center">
                        {lang === "fr"
                            ? "Aucun rôle assignable."
                            : "No assignable roles."}
                    </p>
                )}

                {selected.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 pt-1">
                        {lang === "fr"
                            ? "Sélectionnez au moins un rôle."
                            : "Select at least one role."}
                    </p>
                )}
            </div>

            <ModalFooter>
                <Button variant="outline" onClick={onClose}>
                    {lang === "fr" ? "Annuler" : "Cancel"}
                </Button>
                <Button onClick={handleSave} isLoading={saving} disabled={selected.length === 0}>
                    {lang === "fr" ? "Enregistrer" : "Save"}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
