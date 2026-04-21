"use client";

import { MoreVertical, ShieldCheck, UserX } from "lucide-react";
import { Badge, Dropdown, useLocale } from "@kbouffe/module-core/ui";
import { type TeamRole } from "../api/permissions";
import { ROLE_LABELS, ROLE_BADGE_VARIANT } from "./constants";

export interface TeamMember {
    id: string;
    userId: string;
    role: string;
    roles?: string[];
    status: string;
    createdAt: string | number | null;
    acceptedAt: string | number | null;
    invitedBy: string | null;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    phone: string | null;
    hasPin?: boolean;
}

interface MemberRowProps {
    member: TeamMember;
    callerRole: TeamRole;
    canManageRoles: boolean;
    canRevoke: boolean;
    onManageRoles: (member: TeamMember) => void;
    onRevoke: (memberId: string) => void;
    isPending?: boolean;
}

export function MemberRow({
    member,
    canManageRoles,
    canRevoke,
    onManageRoles,
    onRevoke,
    isPending,
}: MemberRowProps) {
    const { locale, t } = useLocale();
    const lang = locale === "fr" ? "fr" : "en";

    const roles: TeamRole[] = (member.roles && member.roles.length > 0
        ? member.roles
        : [member.role]) as TeamRole[];

    const initials = (member.fullName ?? member.email)
        .split(" ")
        .map((s) => s[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const hasActions = canManageRoles || canRevoke;

    const dropdownItems = [
        ...(canManageRoles
            ? [
                {
                    label: lang === "fr" ? "Gérer les rôles" : "Manage roles",
                    icon: ShieldCheck,
                    onClick: () => onManageRoles(member),
                },
            ]
            : []),
        ...(canRevoke
            ? [
                {
                    label: isPending ? t.team.cancelInvite : t.team.revokeMember,
                    icon: UserX,
                    onClick: () => onRevoke(member.id),
                    variant: "danger" as const,
                },
            ]
            : []),
    ];

    return (
        <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
            {/* Avatar */}
            {member.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={member.avatarUrl}
                    alt={member.fullName ?? ""}
                    className="w-10 h-10 rounded-full object-cover"
                />
            ) : (
                <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-sm shrink-0">
                    {initials}
                </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                    {member.fullName ?? member.email}
                </p>
                <p className="text-xs text-surface-500 truncate">{member.email}</p>
            </div>

            {/* Role badges (multi) */}
            <div className="flex flex-wrap items-center gap-1 justify-end max-w-[45%]">
                {isPending ? (
                    <Badge variant="warning">{t.team.pending}</Badge>
                ) : (
                    roles.map((r) => (
                        <Badge key={r} variant={ROLE_BADGE_VARIANT[r] ?? "default"}>
                            {ROLE_LABELS[r]?.[lang] ?? r}
                        </Badge>
                    ))
                )}
            </div>

            {/* Actions */}
            {hasActions && (
                <Dropdown
                    items={dropdownItems}
                    trigger={
                        <button className="p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
                            <MoreVertical size={16} />
                        </button>
                    }
                />
            )}
        </div>
    );
}
