"use client";

import { useMemo, useState } from "react";
import { Mail, User, Phone, Lock, UserPlus, Send, ShieldCheck } from "lucide-react";
import { Modal, ModalFooter, Button, Input, toast, useLocale, authFetch } from "@kbouffe/module-core/ui";
import { ASSIGNABLE_ROLES, type TeamRole, canManageRole } from "../api/permissions";
import { ROLE_LABELS } from "./constants";

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInvited: () => void;
    callerRole: TeamRole;
    allowedRoles?: TeamRole[];
}

type Tab = "invite" | "create";

function RolesMultiSelect({
    available,
    selected,
    onChange,
    lang,
}: {
    available: TeamRole[];
    selected: TeamRole[];
    onChange: (roles: TeamRole[]) => void;
    lang: "fr" | "en";
}) {
    const toggle = (role: TeamRole) => {
        onChange(
            selected.includes(role)
                ? selected.filter((r) => r !== role)
                : [...selected, role]
        );
    };

    return (
        <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                {lang === "fr" ? "Rôles (un ou plusieurs)" : "Roles (one or more)"}
            </label>
            <div className="grid grid-cols-2 gap-2">
                {available.map((role) => {
                    const checked = selected.includes(role);
                    return (
                        <label
                            key={role}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
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
                                size={14}
                                className={checked ? "text-brand-500" : "text-surface-400"}
                            />
                            <span className="text-sm text-surface-900 dark:text-white">
                                {ROLE_LABELS[role][lang]}
                            </span>
                        </label>
                    );
                })}
            </div>
            {selected.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    {lang === "fr"
                        ? "Sélectionnez au moins un rôle."
                        : "Select at least one role."}
                </p>
            )}
        </div>
    );
}

export function InviteModal({ isOpen, onClose, onInvited, callerRole, allowedRoles }: InviteModalProps) {
    const { locale, t } = useLocale();
    const lang = locale === "fr" ? "fr" : "en";

    const [tab, setTab] = useState<Tab>("invite");
    const [loading, setLoading] = useState(false);

    // Invite tab state
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRoles, setInviteRoles] = useState<TeamRole[]>(["viewer"]);

    // Create tab state
    const [fullName, setFullName] = useState("");
    const [createEmail, setCreateEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [createRoles, setCreateRoles] = useState<TeamRole[]>(["viewer"]);

    const availableRoles = useMemo(
        () =>
            ASSIGNABLE_ROLES.filter((r) => canManageRole(callerRole, r)).filter((r) =>
                allowedRoles ? allowedRoles.includes(r) : true
            ),
        [callerRole, allowedRoles]
    );

    function resetAndClose() {
        setInviteEmail("");
        setInviteRoles(["viewer"]);
        setFullName("");
        setCreateEmail("");
        setPhone("");
        setPassword("");
        setCreateRoles(["viewer"]);
        setTab("invite");
        onClose();
    }

    const handleInvite = async () => {
        if (!inviteEmail.trim()) {
            toast.error(t.team.emailRequired);
            return;
        }
        if (inviteRoles.length === 0) {
            toast.error(lang === "fr" ? "Sélectionnez au moins un rôle." : "Select at least one role.");
            return;
        }

        setLoading(true);
        try {
            const res = await authFetch("/api/team/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: inviteEmail.trim(),
                    role: inviteRoles[0],
                    roles: inviteRoles,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error((data as any).error ?? t.common.error);
                return;
            }

            toast.success(t.team.inviteSent);
            resetAndClose();
            onInvited();
        } catch {
            toast.error(t.common.error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!fullName.trim()) {
            toast.error(lang === "fr" ? "Le nom complet est requis" : "Full name is required");
            return;
        }
        if (!createEmail.trim()) {
            toast.error(t.team.emailRequired);
            return;
        }
        if (!password || password.length < 8) {
            toast.error(lang === "fr" ? "Le mot de passe doit contenir au moins 8 caractères" : "Password must be at least 8 characters");
            return;
        }
        if (createRoles.length === 0) {
            toast.error(lang === "fr" ? "Sélectionnez au moins un rôle." : "Select at least one role.");
            return;
        }

        setLoading(true);
        try {
            const res = await authFetch("/api/team/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: fullName.trim(),
                    email: createEmail.trim(),
                    phone: phone.trim() || undefined,
                    password,
                    role: createRoles[0],
                    roles: createRoles,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error((data as any).error ?? t.common.error);
                return;
            }

            toast.success(lang === "fr" ? "Membre créé et ajouté à l'équipe" : "Member created and added to team");
            resetAndClose();
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
            onClose={resetAndClose}
            title={lang === "fr" ? "Ajouter un membre" : "Add a member"}
            description={lang === "fr" ? "Invitez par email ou créez directement un compte." : "Invite by email or create an account directly."}
        >
            {/* Tabs */}
            <div className="flex rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden mb-5">
                <button
                    type="button"
                    onClick={() => setTab("invite")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
                        tab === "invite"
                            ? "bg-brand-500 text-white"
                            : "bg-transparent text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800"
                    }`}
                >
                    <Send size={14} />
                    {lang === "fr" ? "Inviter" : "Invite"}
                </button>
                <button
                    type="button"
                    onClick={() => setTab("create")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
                        tab === "create"
                            ? "bg-brand-500 text-white"
                            : "bg-transparent text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800"
                    }`}
                >
                    <UserPlus size={14} />
                    {lang === "fr" ? "Créer un compte" : "Create account"}
                </button>
            </div>

            {tab === "invite" ? (
                <div className="space-y-4">
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                        {lang === "fr"
                            ? "L'utilisateur doit déjà avoir un compte Kbouffe. Il recevra une invitation à accepter."
                            : "The user must already have a Kbouffe account. They will receive an invitation to accept."}
                    </p>
                    <Input
                        label={t.team.emailLabel}
                        type="email"
                        placeholder="employe@email.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        leftIcon={<Mail size={16} />}
                    />
                    <RolesMultiSelect
                        available={availableRoles}
                        selected={inviteRoles}
                        onChange={setInviteRoles}
                        lang={lang}
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                        {lang === "fr"
                            ? "Un compte sera créé automatiquement. Le membre pourra se connecter avec ses identifiants."
                            : "An account will be created automatically. The member can log in with their credentials."}
                    </p>
                    <Input
                        label={lang === "fr" ? "Nom complet" : "Full name"}
                        type="text"
                        placeholder={lang === "fr" ? "Jean Dupont" : "John Doe"}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        leftIcon={<User size={16} />}
                    />
                    <Input
                        label={t.team.emailLabel}
                        type="email"
                        placeholder="employe@email.com"
                        value={createEmail}
                        onChange={(e) => setCreateEmail(e.target.value)}
                        leftIcon={<Mail size={16} />}
                    />
                    <Input
                        label={lang === "fr" ? "Téléphone (optionnel)" : "Phone (optional)"}
                        type="tel"
                        placeholder="+225 07 00 00 00 00"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        leftIcon={<Phone size={16} />}
                    />
                    <Input
                        label={lang === "fr" ? "Mot de passe" : "Password"}
                        type="password"
                        placeholder={lang === "fr" ? "Min. 8 caractères" : "Min. 8 characters"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        leftIcon={<Lock size={16} />}
                    />
                    <RolesMultiSelect
                        available={availableRoles}
                        selected={createRoles}
                        onChange={setCreateRoles}
                        lang={lang}
                    />
                </div>
            )}

            <ModalFooter>
                <Button variant="outline" onClick={resetAndClose}>
                    {t.common.cancel}
                </Button>
                {tab === "invite" ? (
                    <Button onClick={handleInvite} isLoading={loading} disabled={inviteRoles.length === 0}>
                        {t.team.sendInvite}
                    </Button>
                ) : (
                    <Button onClick={handleCreate} isLoading={loading} disabled={createRoles.length === 0}>
                        {lang === "fr" ? "Créer et ajouter" : "Create & add"}
                    </Button>
                )}
            </ModalFooter>
        </Modal>
    );
}
