"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UsersIcon, TrashIcon, CrownIcon, ClockIcon, UserIcon } from "@phosphor-icons/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface MemberToRemove {
    id: string;
    name: string;
}

function RoleSelector({ member, onUpdateRole, isUpdatingMember, organizationId }: any) {
    if (member.role === "owner") {
        return (
            <Badge
                variant="default"
                className="px-2 py-1 bg-amber-100 text-amber-800 border-amber-200"
            >
                Owner
            </Badge>
        );
    }

    return (
        <Select
            defaultValue={member.role}
            onValueChange={(newRole) => onUpdateRole({ memberId: member.id, role: newRole, organizationId })}
            disabled={isUpdatingMember}
        >
            <SelectTrigger className="w-32 rounded">
                <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
            </SelectContent>
        </Select>
    );
}

export function MemberList({ members, onRemoveMember, isRemovingMember, onUpdateRole, isUpdatingMember, organizationId }: any) {
    const [memberToRemove, setMemberToRemove] = useState<MemberToRemove | null>(null);

    const handleRemove = async () => {
        if (!memberToRemove) return;
        await onRemoveMember(memberToRemove.id);
        setMemberToRemove(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <UsersIcon size={16} weight="duotone" className="h-5 w-5" />
                    Team Members
                </h3>
                <Badge variant="outline" className="px-2 py-1">
                    {members?.length || 0} active
                </Badge>
            </div>

            {members && members.length > 0 ? (
                <div className="space-y-3">
                    {members.map((member: any) => (
                        <div
                            key={member.id}
                            className="p-4 rounded border border-border/50 bg-muted/30 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 border border-border/50">
                                    <AvatarImage src={member.user.image || undefined} alt={member.user.name} />
                                    <AvatarFallback className="text-sm bg-accent font-medium">
                                        {member.user.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">{member.user.name}</p>
                                        {member.role === "owner" && (
                                            <CrownIcon size={16} className="h-4 w-4 text-amber-500" />
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                        <ClockIcon size={16} className="h-3 w-3" />
                                        Joined {dayjs(member.createdAt).fromNow()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <RoleSelector
                                    member={member}
                                    onUpdateRole={onUpdateRole}
                                    isUpdatingMember={isUpdatingMember}
                                    organizationId={organizationId}
                                />
                                {member.role !== "owner" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                                        onClick={() => setMemberToRemove({ id: member.id, name: member.user.name })}
                                        disabled={isRemovingMember}
                                    >
                                        <TrashIcon size={16} className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 border border-border/50 rounded bg-muted/30">
                    <UserIcon size={32} weight="duotone" className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No team members yet</p>
                </div>
            )}

            <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove {memberToRemove?.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently remove the member from the organization.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemove}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 