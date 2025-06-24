"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    BuildingsIcon,
    UsersIcon,
    GearIcon,
    TrashIcon,
    PlusIcon,
    CheckIcon,
    CalendarIcon
} from "@phosphor-icons/react";
import { useOrganizations } from "@/hooks/use-organizations";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";

dayjs.extend(relativeTime);

interface OrganizationsTabProps {
    organizations: any[] | undefined;
    activeOrganization: any | null;
    isLoading: boolean;
    onCreateOrganization: () => void;
}

export function OrganizationsTab({
    organizations,
    activeOrganization,
    isLoading,
    onCreateOrganization
}: OrganizationsTabProps) {
    const { setActiveOrganization, deleteOrganization, isSettingActiveOrganization, isDeletingOrganization } = useOrganizations();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const getOrganizationInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleSetActive = (organizationId: string) => {
        setActiveOrganization(organizationId);
    };

    const handleDelete = async (organizationId: string, organizationName: string) => {
        if (!confirm(`Are you sure you want to delete "${organizationName}"? This action cannot be undone.`)) {
            return;
        }

        setDeletingId(organizationId);
        try {
            deleteOrganization(organizationId);
        } catch (error) {
            toast.error("Failed to delete organization");
        } finally {
            setDeletingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-6 rounded border border-border/50 bg-muted/30 space-y-4">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-32 rounded" />
                                    <Skeleton className="h-4 w-24 rounded" />
                                </div>
                            </div>
                            <Skeleton className="h-8 w-full rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!organizations || organizations.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="p-6 rounded border border-border/50 bg-muted/30 max-w-md mx-auto">
                    <div className="p-4 rounded-full bg-primary/10 border border-primary/20 w-fit mx-auto mb-4">
                        <BuildingsIcon size={32} weight="duotone" className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Organizations Yet</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                        Create your first organization to start collaborating with your team.
                    </p>
                    <Button onClick={onCreateOrganization} className="rounded">
                        <PlusIcon size={16} className="h-4 w-4 mr-2" />
                        Create Organization
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Your Organizations</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage and switch between your organizations
                    </p>
                </div>
                <Button onClick={onCreateOrganization} size="sm" className="rounded">
                    <PlusIcon size={16} className="h-4 w-4 mr-2" />
                    New Organization
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {organizations.map((org) => {
                    const isActive = activeOrganization?.id === org.id;
                    const isDeleting = deletingId === org.id;

                    return (
                        <div
                            key={org.id}
                            className={cn(
                                "p-6 rounded border transition-all duration-200 relative",
                                isActive
                                    ? "border-primary/50 bg-primary/5 shadow-md"
                                    : "border-border/50 bg-muted/30 hover:border-border/70 hover:bg-muted/40"
                            )}
                        >
                            {isActive && (
                                <div className="absolute top-3 right-3">
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                        <CheckIcon size={16} className="h-3 w-3 mr-1" />
                                        Active
                                    </Badge>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-12 w-12 border border-border/50">
                                        <AvatarImage src={org.logo || undefined} alt={org.name} />
                                        <AvatarFallback className="text-sm font-medium bg-accent">
                                            {getOrganizationInitials(org.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate">{org.name}</h3>
                                        <p className="text-sm text-muted-foreground truncate">{org.slug}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <CalendarIcon size={16} className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">
                                                Created {dayjs(org.createdAt).fromNow()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {!isActive ? (
                                        <Button
                                            onClick={() => handleSetActive(org.id)}
                                            disabled={isSettingActiveOrganization}
                                            size="sm"
                                            className="flex-1 rounded"
                                        >
                                            {isSettingActiveOrganization ? (
                                                <>
                                                    <div className="w-3 h-3 rounded-full border border-primary-foreground/30 border-t-primary-foreground animate-spin mr-2" />
                                                    Switching...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckIcon size={16} className="h-3 w-3 mr-2" />
                                                    Set Active
                                                </>
                                            )}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 rounded"
                                            disabled
                                        >
                                            <UsersIcon size={16} className="h-3 w-3 mr-2" />
                                            Current Workspace
                                        </Button>
                                    )}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded"
                                        asChild
                                    >
                                        <Link href={`/organizations/${org.slug}`}>
                                            <GearIcon size={16} className="h-3 w-3" />
                                        </Link>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                                        onClick={() => handleDelete(org.id, org.name)}
                                        disabled={isDeleting || isDeletingOrganization}
                                    >
                                        {isDeleting ? (
                                            <div className="w-3 h-3 rounded-full border border-destructive/30 border-t-destructive animate-spin" />
                                        ) : (
                                            <TrashIcon size={16} className="h-3 w-3" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
} 