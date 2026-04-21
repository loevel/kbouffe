"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, Loader2, KeyRound } from "lucide-react";
import { Card, Button, Badge, toast, useDashboard, useLocale, authFetch } from "@kbouffe/module-core/ui";
import { type TeamRole, canManageRole, ASSIGNABLE_ROLES } from "../api/permissions";
import { InviteModal } from "./InviteModal";
import { MemberRow, type TeamMember } from "./MemberRow";
import { PinSetupModal } from "./PinSetupModal";
import { ManageRolesModal } from "./ManageRolesModal";

interface TeamListProps {
    filterRole?: TeamRole;
}

function getMemberRoles(m: TeamMember): TeamRole[] {
    return (m.roles && m.roles.length > 0 ? m.roles : [m.role]) as TeamRole[];
}

export function TeamList({ filterRole }: TeamListProps = {}) {
    const { can, teamRole } = useDashboard();
    const { t, locale } = useLocale();
    const lang = locale === "fr" ? "fr" : "en";
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);

    // PIN setup modal state
    const [pinModalMember, setPinModalMember] = useState<TeamMember | null>(null);
    // Manage-roles modal state
    const [rolesModalMember, setRolesModalMember] = useState<TeamMember | null>(null);

    const fetchMembers = useCallback(async () => {
        try {
            const res = await authFetch("/api/team");
            if (!res.ok) return;
            const data = await res.json();
            const fetchedMembers: TeamMember[] = (data as any).members ?? [];
            if (filterRole) {
                setMembers(fetchedMembers.filter(m => getMemberRoles(m).includes(filterRole)));
            } else {
                setMembers(fetchedMembers);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [filterRole]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleSaveRoles = async (memberId: string, newRoles: TeamRole[]) => {
        // Backend (single-role) attend un role ∈ ASSIGNABLE_ROLES.
        // On filtre les rôles non assignables (ex: "owner") pour la compat.
        const assignable = newRoles.filter((r) => (ASSIGNABLE_ROLES as TeamRole[]).includes(r));
        if (assignable.length === 0) {
            toast.error(lang === "fr" ? "Aucun rôle assignable sélectionné." : "No assignable role selected.");
            return;
        }
        const res = await authFetch(`/api/team/${memberId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roles: assignable, role: assignable[0] }),
        });
        if (!res.ok) {
            const data = await res.json();
            toast.error((data as any).error ?? t.common.error);
            return;
        }
        toast.success(t.team.roleUpdated);
        fetchMembers();
    };

    const handleRevoke = async (memberId: string) => {
        const res = await authFetch(`/api/team/${memberId}`, { method: "DELETE" });
        if (!res.ok) {
            const data = await res.json();
            toast.error((data as any).error ?? t.common.error);
            return;
        }
        toast.success(t.team.memberRevoked);
        fetchMembers();
    };

    // Caller can set any member's PIN if they have team:manage_roles
    const canManagePins = can("team:manage_roles");
    const callerRole = teamRole as TeamRole;

    const activeMembers = members.filter((m) => m.status === "active");
    const pendingMembers = members.filter((m) => m.status === "pending");

    const canManageMemberRoles = (m: TeamMember) => {
        if (!can("team:manage_roles")) return false;
        // Caller must strictly outrank every one of the member's current roles.
        // (Un owner ne peut pas éditer un autre owner, un manager ne peut pas éditer un manager, etc.)
        return getMemberRoles(m).every((r) => canManageRole(callerRole, r));
    };

    const canRevokeMember = (m: TeamMember) => {
        if (!can("team:invite")) return false;
        const roles = getMemberRoles(m);
        if (roles.includes("owner")) return false;
        return roles.every((r) => canManageRole(callerRole, r));
    };

    if (loading) {
        return (
            <Card className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            </Card>
        );
    }

    return (
        <>
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                            {t.team.membersTitle}
                        </h2>
                        <Badge variant="default">{activeMembers.length} {t.team.active}</Badge>
                    </div>
                    {can("team:invite") && (
                        <Button
                            size="sm"
                            leftIcon={<UserPlus size={16} />}
                            onClick={() => setShowInvite(true)}
                        >
                            {t.team.invite}
                        </Button>
                    )}
                </div>

                {/* Hint: multi-role supported */}
                <p className="text-xs text-surface-500 dark:text-surface-400 mb-4">
                    {lang === "fr"
                        ? "Un membre peut cumuler plusieurs rôles (ex : Gérant + Propriétaire)."
                        : "A member can hold multiple roles at once (e.g. Manager + Owner)."}
                </p>

                {/* Active members */}
                <div className="space-y-2">
                    {activeMembers.map((member) => (
                        <div key={member.id} className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                                <MemberRow
                                    member={member}
                                    callerRole={callerRole}
                                    canManageRoles={canManageMemberRoles(member)}
                                    canRevoke={canRevokeMember(member)}
                                    onManageRoles={setRolesModalMember}
                                    onRevoke={handleRevoke}
                                />
                            </div>

                            {/* PIN indicator + button */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                {member.hasPin && (
                                    <span
                                        title="PIN actif"
                                        className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1"
                                    >
                                        🔑 <span className="hidden sm:inline">PIN actif</span>
                                    </span>
                                )}
                                {canManagePins && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        leftIcon={<KeyRound size={14} />}
                                        onClick={() => setPinModalMember(member)}
                                        title={member.hasPin ? "Modifier le PIN" : "Définir un PIN"}
                                        className="text-xs"
                                    >
                                        <span className="hidden sm:inline">
                                            {member.hasPin ? "PIN" : "Définir PIN"}
                                        </span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                    {activeMembers.length === 0 && (
                        <p className="text-sm text-surface-400 py-4 text-center">{t.team.noMembers}</p>
                    )}
                </div>

                {/* Pending invitations */}
                {pendingMembers.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-sm font-medium text-surface-500 dark:text-surface-400 mb-3">
                            {t.team.pendingInvites} ({pendingMembers.length})
                        </h3>
                        <div className="space-y-2">
                            {pendingMembers.map((member) => (
                                <MemberRow
                                    key={member.id}
                                    member={member}
                                    callerRole={callerRole}
                                    canManageRoles={false}
                                    canRevoke={can("team:invite")}
                                    onManageRoles={setRolesModalMember}
                                    onRevoke={handleRevoke}
                                    isPending
                                />
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            <InviteModal
                isOpen={showInvite}
                onClose={() => setShowInvite(false)}
                onInvited={fetchMembers}
                callerRole={callerRole}
                allowedRoles={filterRole ? [filterRole] : undefined}
            />

            {/* PIN setup modal */}
            {pinModalMember && (
                <PinSetupModal
                    isOpen={pinModalMember !== null}
                    onClose={() => setPinModalMember(null)}
                    memberId={pinModalMember.id}
                    memberName={pinModalMember.fullName ?? pinModalMember.email}
                    hasPin={pinModalMember.hasPin ?? false}
                    onSuccess={fetchMembers}
                />
            )}

            {/* Manage-roles modal */}
            {rolesModalMember && (
                <ManageRolesModal
                    isOpen={rolesModalMember !== null}
                    onClose={() => setRolesModalMember(null)}
                    memberName={rolesModalMember.fullName ?? rolesModalMember.email}
                    initialRoles={getMemberRoles(rolesModalMember)}
                    callerRole={callerRole}
                    onSave={(roles) => handleSaveRoles(rolesModalMember.id, roles)}
                />
            )}
        </>
    );
}
