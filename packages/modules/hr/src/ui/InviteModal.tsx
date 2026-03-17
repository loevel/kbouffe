"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Modal, ModalFooter, Button, Input, Select, toast, useLocale } from "@kbouffe/module-core/ui";
import { ASSIGNABLE_ROLES, type TeamRole, canManageRole } from "../api/permissions";
import { ROLE_LABELS } from "./constants";

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInvited: () => void;
    callerRole: TeamRole;
    allowedRoles?: TeamRole[];
}

export function InviteModal({ isOpen, onClose, onInvited, callerRole, allowedRoles }: InviteModalProps) {
    const { locale, t } = useLocale();
    const lang = locale === "fr" ? "fr" : "en";

    const [email, setEmail] = useState("");
    const [role, setRole] = useState<TeamRole>("viewer");
    const [loading, setLoading] = useState(false);

    const availableRoles = ASSIGNABLE_ROLES.filter((r) => canManageRole(callerRole, r))
                                           .filter(r => allowedRoles ? allowedRoles.includes(r) : true);

    const handleSubmit = async () => {
        if (!email.trim()) {
            toast.error(t.team.emailRequired);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/team/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim(), role }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error((data as any).error ?? t.common.error);
                return;
            }

            toast.success(t.team.inviteSent);
            setEmail("");
            setRole("viewer");
            onClose();
            onInvited();
        } catch {
            toast.error(t.common.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t.team.inviteTitle}
            description={t.team.inviteDesc}
        >
            <div className="space-y-4">
                <Input
                    label={t.team.emailLabel}
                    type="email"
                    placeholder="employe@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={<Mail size={16} />}
                />

                <Select
                    label={t.team.roleLabel}
                    value={role}
                    onChange={(e) => setRole(e.target.value as TeamRole)}
                    options={availableRoles.map((r) => ({
                        value: r,
                        label: ROLE_LABELS[r][lang],
                    }))}
                />
            </div>

            <ModalFooter>
                <Button variant="outline" onClick={onClose}>
                    {t.common.cancel}
                </Button>
                <Button onClick={handleSubmit} isLoading={loading}>
                    {t.team.sendInvite}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
