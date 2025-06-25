"use client";

import { useState } from "react";
import { useOrganizationMembers, useOrganizationInvitations } from "@/hooks/use-organizations";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlusIcon, UsersIcon, EnvelopeIcon, CrownIcon } from "@phosphor-icons/react";

// Import sub-components that will be created next
import { MemberList } from "./member-list";
import { InvitationList } from "./invitation-list";
import { InviteMemberDialog } from "./invite-member-dialog";

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: number }) => (
    <div className="p-4 rounded border border-border/50 bg-muted/30">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-primary/10 border border-primary/20">
                <Icon size={16} weight="duotone" className="h-5 w-5 text-primary" />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-xl font-semibold">{value}</p>
            </div>
        </div>
    </div>
);

const ViewSkeleton = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
        <div className="flex justify-end">
            <Skeleton className="h-9 w-44" />
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
    </div>
);

export function TeamView({ organization }: { organization: any }) {
    const [showInviteDialog, setShowInviteDialog] = useState(false);

    const {
        members,
        isLoading: isLoadingMembers,
        removeMember,
        isRemovingMember,
        updateMember,
        isUpdatingMember,
        error: membersError,
    } = useOrganizationMembers(organization.id);

    const {
        invitations,
        isLoading: isLoadingInvitations,
        cancelInvitation,
        isCancellingInvitation,
        error: invitationsError,
    } = useOrganizationInvitations(organization.id);

    if (isLoadingMembers || isLoadingInvitations) {
        return <ViewSkeleton />;
    }

    if (membersError || invitationsError) {
        return (
            <div className="text-center py-12 border rounded">
                <p className="text-destructive">Failed to load team data.</p>
                <p className="text-sm text-muted-foreground">
                    {(membersError || invitationsError)?.message}
                </p>
            </div>
        );
    }

    const activeInvitations = invitations?.filter(inv => inv.status === "pending") || [];
    const totalMembers = (members?.length || 0) + activeInvitations.length;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={UsersIcon} label="Active Members" value={members?.length || 0} />
                <StatCard icon={EnvelopeIcon} label="Pending Invites" value={activeInvitations.length} />
                <StatCard icon={CrownIcon} label="Total Team Size" value={totalMembers} />
            </div>

            <div className="flex justify-end">
                <Button onClick={() => setShowInviteDialog(true)} className="rounded">
                    <PlusIcon size={16} className="h-4 w-4 mr-2" />
                    Invite Team Member
                </Button>
            </div>

            <MemberList
                members={members}
                onRemoveMember={removeMember}
                isRemovingMember={isRemovingMember}
                onUpdateRole={updateMember}
                isUpdatingMember={isUpdatingMember}
                organizationId={organization.id}
            />

            <InvitationList
                invitations={activeInvitations}
                onCancelInvitation={cancelInvitation}
                isCancellingInvitation={isCancellingInvitation}
            />

            <InviteMemberDialog
                isOpen={showInviteDialog}
                onClose={() => setShowInviteDialog(false)}
                organizationId={organization.id}
            />
        </div>
    );
} 