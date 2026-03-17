"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { Card, Button, Badge, toast, useDashboard, useLocale } from "@kbouffe/module-core/ui";
import { type TeamRole, ASSIGNABLE_ROLES, canManageRole } from "../api/permissions";
import { ROLE_BADGE_VARIANT } from "./constants";
import { InviteModal } from "./InviteModal";
import { MemberRow, type TeamMember } from "./MemberRow";

interface TeamListProps {
    filterRole?: TeamRole;
}

export function TeamList({ filterRole }: TeamListProps = {}) {
    const { can, teamRole } = useDashboard();
    const { t } = useLocale();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);

    const fetchMembers = useCallback(async () => {
        try {
            const res = await fetch("/api/team");
            if (!res.ok) return;
            const data = await res.json();
            const fetchedMembers: TeamMember[] = (data as any).members ?? [];
            if (filterRole) {
                setMembers(fetchedMembers.filter(m => m.role === filterRole));
            } else {
                setMembers(fetchedMembers);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleRoleChange = async (memberId: string, newRole: TeamRole) => {
        const res = await fetch(`/api/team/${memberId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: newRole }),
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
        const res = await fetch(`/api/team/${memberId}`, { method: "DELETE" });
        if (!res.ok) {
            const data = await res.json();
            toast.error((data as any).error ?? t.common.error);
            return;
        }
        toast.success(t.team.memberRevoked);
        fetchMembers();
    };

    const activeMembers = members.filter((m) => m.status === "active");
    const pendingMembers = members.filter((m) => m.status === "pending");

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

                {/* Active members */}
                <div className="space-y-2">
                    {activeMembers.map((member) => (
                        <MemberRow
                            key={member.id}
                            member={member}
                            callerRole={teamRole as TeamRole}
                            badgeVariant={ROLE_BADGE_VARIANT[member.role as TeamRole] ?? "default"}
                            assignableRoles={ASSIGNABLE_ROLES.filter((r) => canManageRole(teamRole as TeamRole, r))}
                            canManageRoles={can("team:manage_roles")}
                            canRevoke={can("team:invite") && canManageRole(teamRole as TeamRole, member.role as TeamRole) && member.role !== "owner"}
                            onRoleChange={handleRoleChange}
                            onRevoke={handleRevoke}
                        />
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
                                    callerRole={teamRole as TeamRole}
                                    badgeVariant="warning"
                                    assignableRoles={[]}
                                    canManageRoles={false}
                                    canRevoke={can("team:invite")}
                                    onRoleChange={handleRoleChange}
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
                callerRole={teamRole as TeamRole}
                allowedRoles={filterRole ? [filterRole] : undefined}
            />
        </>
    );
}
