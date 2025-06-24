"use client";

import * as React from "react";
import { CaretDownIcon, PlusIcon, UsersIcon, CheckIcon, UserIcon } from "@phosphor-icons/react";
import { useOrganizations } from "@/hooks/use-organizations";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateOrganizationDialog } from "@/components/organizations/create-organization-dialog";

export function OrganizationSelector() {
    const {
        organizations,
        activeOrganization,
        isLoading,
        setActiveOrganization,
        isSettingActiveOrganization
    } = useOrganizations();
    const router = useRouter();
    const [isOpen, setIsOpen] = React.useState(false);
    const [showCreateDialog, setShowCreateDialog] = React.useState(false);

    if (isLoading) {
        return (
            <div className="px-2 py-2 bg-accent/30 rounded border border-border/50">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-24 rounded" />
                        <Skeleton className="h-3 w-16 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    const handleSelectOrganization = async (organizationId: string | null) => {
        if (organizationId === activeOrganization?.id) return;
        if (organizationId === null && !activeOrganization) return;
        setActiveOrganization(organizationId);
        setIsOpen(false);
    };

    const handleCreateOrganization = () => {
        setShowCreateDialog(true);
        setIsOpen(false);
    };

    const handleManageOrganizations = () => {
        router.push("/organizations");
        setIsOpen(false);
    };

    const getOrganizationInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="w-full h-auto p-0 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                        disabled={isSettingActiveOrganization}
                    >
                        <div className={cn(
                            "px-2 py-2 bg-accent/30 rounded border border-border/50 transition-all duration-200 w-full",
                            "hover:bg-accent/50 hover:border-border/70",
                            isSettingActiveOrganization && "opacity-70 cursor-not-allowed",
                            isOpen && "bg-accent/50 border-border/70"
                        )}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 border border-border/50">
                                        <AvatarImage
                                            src={activeOrganization?.logo || undefined}
                                            alt={activeOrganization?.name || "Personal"}
                                        />
                                        <AvatarFallback className="text-xs font-medium bg-muted">
                                            {activeOrganization?.name ? (
                                                getOrganizationInitials(activeOrganization.name)
                                            ) : (
                                                <UserIcon size={32} weight="duotone" className="h-4 w-4" />
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col text-left min-w-0">
                                        <span className="text-sm font-medium truncate max-w-[140px]">
                                            {activeOrganization?.name || "Personal"}
                                        </span>
                                        <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                                            {activeOrganization?.slug || "Your workspace"}
                                        </span>
                                    </div>
                                </div>
                                <CaretDownIcon
                                    size={32}
                                    weight="duotone"
                                    className={cn(
                                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                        isOpen && "rotate-180"
                                    )}
                                />
                            </div>
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-1" align="start" sideOffset={4}>
                    {/* Personal Workspace */}
                    <DropdownMenuItem
                        onClick={() => handleSelectOrganization(null)}
                        className={cn(
                            "flex items-center gap-3 cursor-pointer rounded px-2 py-2 transition-colors",
                            "focus:bg-accent focus:text-accent-foreground",
                            !activeOrganization && "bg-accent text-accent-foreground"
                        )}
                    >
                        <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-muted">
                                <UserIcon size={32} weight="duotone" className="h-4 w-4" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-medium">Personal</span>
                            <span className="text-xs text-muted-foreground">Your workspace</span>
                        </div>
                        {!activeOrganization && (
                            <CheckIcon size={32} weight="duotone" className="h-4 w-4 text-primary" />
                        )}
                    </DropdownMenuItem>

                    {organizations && organizations.length > 0 && (
                        <>
                            <DropdownMenuSeparator className="my-1" />
                            {organizations.map((org) => (
                                <DropdownMenuItem
                                    key={org.id}
                                    onClick={() => handleSelectOrganization(org.id)}
                                    className={cn(
                                        "flex items-center gap-3 cursor-pointer rounded px-2 py-2 transition-colors",
                                        "focus:bg-accent focus:text-accent-foreground",
                                        activeOrganization?.id === org.id && "bg-accent text-accent-foreground"
                                    )}
                                >
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={org.logo || undefined} alt={org.name} />
                                        <AvatarFallback className="text-xs bg-muted">
                                            {getOrganizationInitials(org.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="text-sm font-medium truncate">{org.name}</span>
                                        <span className="text-xs text-muted-foreground truncate">{org.slug}</span>
                                    </div>
                                    {activeOrganization?.id === org.id && (
                                        <CheckIcon size={32} weight="duotone" className="h-4 w-4 text-primary" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </>
                    )}

                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem
                        onClick={handleCreateOrganization}
                        className="flex items-center gap-3 cursor-pointer rounded px-2 py-2 transition-colors focus:bg-accent focus:text-accent-foreground"
                    >
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                            <PlusIcon size={32} className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm font-medium">Create Organization</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={handleManageOrganizations}
                        className="flex items-center gap-3 cursor-pointer rounded px-2 py-2 transition-colors focus:bg-accent focus:text-accent-foreground"
                    >
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                            <UsersIcon size={32} weight="duotone" className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm font-medium">Manage Organizations</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <CreateOrganizationDialog
                isOpen={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
            />
        </>
    );
} 