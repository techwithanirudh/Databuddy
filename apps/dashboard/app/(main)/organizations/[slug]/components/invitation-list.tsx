"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { EnvelopeIcon, ClockIcon, TrashIcon } from "@phosphor-icons/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface InvitationToCancel {
    id: string;
    email: string;
}

export function InvitationList({ invitations, onCancelInvitation, isCancellingInvitation }: any) {
    const [invitationToCancel, setInvitationToCancel] = useState<InvitationToCancel | null>(null);

    const handleCancel = async () => {
        if (!invitationToCancel) return;
        await onCancelInvitation(invitationToCancel.id);
        setInvitationToCancel(null);
    };

    if (invitations.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <EnvelopeIcon size={16} weight="duotone" className="h-5 w-5" />
                    Pending Invitations
                </h3>
                <Badge variant="outline" className="px-2 py-1">
                    {invitations.length} pending
                </Badge>
            </div>
            <div className="space-y-3">
                {invitations.map((invitation: any) => (
                    <div
                        key={invitation.id}
                        className="p-4 rounded border border-border/50 bg-muted/30 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-full bg-accent border border-border/50">
                                <EnvelopeIcon size={16} className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium">{invitation.email}</p>
                                <p className="text-sm text-muted-foreground">
                                    Invited as {invitation.role} • {invitation.status}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <ClockIcon size={16} className="h-3 w-3" />
                                    Expires {dayjs(invitation.expiresAt).fromNow()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                                onClick={() => setInvitationToCancel({ id: invitation.id, email: invitation.email })}
                                disabled={isCancellingInvitation}
                            >
                                <TrashIcon size={16} className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <AlertDialog open={!!invitationToCancel} onOpenChange={(open) => !open && setInvitationToCancel(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel invitation for {invitationToCancel?.email}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. The invitation will be cancelled.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 