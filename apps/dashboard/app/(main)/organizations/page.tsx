"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BuildingsIcon, UsersIcon, PlusIcon, GearIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { useOrganizations } from "@/hooks/use-organizations";
import { CreateOrganizationDialog } from "@/components/organizations/create-organization-dialog";

// Dynamic imports for tab components
const OrganizationsTab = dynamic(() => import("./components/organizations-tab").then(mod => ({ default: mod.OrganizationsTab })), {
    loading: () => <TabSkeleton />,
    ssr: false
});

const TeamsTab = dynamic(() => import("./[slug]/components/teams-tab").then(mod => ({ default: mod.TeamsTab })), {
    loading: () => <TabSkeleton />,
    ssr: false
});

function TabSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded" />
            <Skeleton className="h-48 w-full rounded" />
        </div>
    );
}

export default function OrganizationsPage() {
    const [activeTab, setActiveTab] = useState("organizations");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const { organizations, activeOrganization, isLoading } = useOrganizations();

    const organizationCount = organizations?.length || 0;
    const hasActiveOrganization = !!activeOrganization;

    return (
        <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Organizations</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your organizations and team collaboration
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {hasActiveOrganization && (
                        <Badge variant="outline" className="px-2 py-1">
                            <BuildingsIcon size={16} className="h-3 w-3 mr-1" />
                            {activeOrganization.name}
                        </Badge>
                    )}
                    <Button
                        onClick={() => setShowCreateDialog(true)}
                        size="sm"
                        className="rounded"
                    >
                        <PlusIcon size={16} className="h-3 w-3 mr-1" />
                        New Organization
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            {!isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded border border-border/50 bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded bg-primary/10 border border-primary/20">
                                <BuildingsIcon size={16} weight="duotone" className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Organizations</p>
                                <p className="text-xl font-semibold">{organizationCount}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded border border-border/50 bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded bg-primary/10 border border-primary/20">
                                <UsersIcon size={16} weight="duotone" className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Active Workspace</p>
                                <p className="text-sm font-medium truncate max-w-[120px]">
                                    {activeOrganization?.name || "Personal"}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded border border-border/50 bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded bg-primary/10 border border-primary/20">
                                <GearIcon size={16} weight="duotone" className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <p className="text-sm font-medium">
                                    {hasActiveOrganization ? "Team Mode" : "Personal Mode"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="border-b relative">
                    <TabsList className="h-10 bg-transparent p-0 w-full justify-start overflow-x-auto">
                        <TabsTrigger
                            value="organizations"
                            className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <BuildingsIcon size={16} className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Organizations</span>
                            {activeTab === "organizations" && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded" />
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="teams"
                            className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <UsersIcon size={16} className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Teams</span>
                            {activeTab === "teams" && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded" />
                            )}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="organizations" className="transition-all duration-200 animate-fadeIn">
                    <Suspense fallback={<TabSkeleton />}>
                        <OrganizationsTab
                            organizations={organizations || []}
                            activeOrganization={activeOrganization}
                            isLoading={isLoading}
                            onCreateOrganization={() => setShowCreateDialog(true)}
                        />
                    </Suspense>
                </TabsContent>

                <TabsContent value="teams" className="transition-all duration-200 animate-fadeIn">
                    <Suspense fallback={<TabSkeleton />}>
                        <TeamsTab
                            organization={activeOrganization || {}}
                        />
                    </Suspense>
                </TabsContent>
            </Tabs>

            <CreateOrganizationDialog
                isOpen={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
            />
        </div>
    );
} 