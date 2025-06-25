"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useOrganizationMembers } from "@/hooks/use-organizations";

export function InviteMemberDialog({ isOpen, onClose, organizationId }: any) {
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"owner" | "admin" | "member">("member");
    const { inviteMember, isInvitingMember } = useOrganizationMembers(organizationId);

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;
        await inviteMember({
            email: inviteEmail.trim(),
            role: inviteRole,
            organizationId: organizationId
        });
        setInviteEmail("");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                        Enter the email address of the person you want to invite.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as any)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="owner">Owner</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleInvite} disabled={isInvitingMember}>
                        {isInvitingMember ? "Inviting..." : "Send Invitation"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 