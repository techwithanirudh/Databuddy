"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    BuildingsIcon,
    UsersIcon,
    GearIcon,
    ChartBarIcon,
    CaretLeftIcon,
    CheckIcon
} from "@phosphor-icons/react";
import { useOrganizations } from "@/hooks/use-organizations";

import { OverviewTab } from "./components/overview-tab";
import { TeamsTab } from "./components/teams-tab";
import { SettingsTab } from "./components/settings-tab";
import { OrganizationPageSkeleton } from "./components/organization-page-skeleton";

const getOrganizationInitials = (name: string) => {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
};

function SetActiveButton({ onSetActive, isSettingActive, isCurrentlyActive }: any) {
    if (isCurrentlyActive) {
        return (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <CheckIcon size={16} className="h-3 w-3 mr-1" />
                Active Workspace
            </Badge>
        );
    }

    return (
        <Button
            onClick={onSetActive}
            disabled={isSettingActive}
            size="sm"
            className="rounded"
        >
            {isSettingActive ? (
                <>
                    <div className="w-3 h-3 rounded-full border border-primary-foreground/30 border-t-primary-foreground animate-spin mr-2" />
                    Switching...
                </>
            ) : (
                <>
                    <CheckIcon size={16} className="h-4 w-4 mr-2" />
                    Set as Active
                </>
            )}
        </Button>
    );
}

function PageHeader({ organization, isCurrentlyActive, onSetActive, isSettingActive }: any) {
    return (
        <div className="p-6 rounded border border-border/50 bg-muted/30">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border border-border/50">
                        <AvatarImage src={organization.logo || undefined} alt={organization.name} />
                        <AvatarFallback className="text-lg font-medium bg-accent">
                            {getOrganizationInitials(organization.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold">{organization.name}</h1>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {organization.slug} • Created {new Date(organization.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <SetActiveButton
                    onSetActive={onSetActive}
                    isSettingActive={isSettingActive}
                    isCurrentlyActive={isCurrentlyActive}
                />
            </div>
        </div>
    );
}

function OrganizationNotFound() {
    return (
        <div className="text-center py-12">
            <div className="p-6 rounded border border-border/50 bg-muted/30 max-w-md mx-auto">
                <div className="p-4 rounded-full bg-destructive/10 border border-destructive/20 w-fit mx-auto mb-4">
                    <BuildingsIcon size={32} weight="duotone" className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Organization Not Found</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    The organization you're looking for doesn't exist or you don't have access to it.
                </p>
                <Button asChild className="rounded">
                    <Link href="/organizations">
                        <CaretLeftIcon size={16} className="h-4 w-4 mr-2" />
                        Back to Organizations
                    </Link>
                </Button>
            </div>
        </div>
    )
}

function ErrorDisplay({ onRetry, error }: any) {
    return (
        <div className="text-center py-12">
            <div className="p-6 rounded border border-border/50 bg-muted/30 max-w-md mx-auto">
                <div className="p-4 rounded-full bg-destructive/10 border border-destructive/20 w-fit mx-auto mb-4">
                    <BuildingsIcon size={32} weight="duotone" className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-destructive">
                    Failed to load organization
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                    {error?.message || "An error occurred while fetching organization data."}
                </p>
                <Button onClick={onRetry} className="rounded">
                    <CaretLeftIcon size={16} className="h-4 w-4 mr-2" />
                    Retry
                </Button>
            </div>
        </div>
    );
}

export default function OrganizationPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [activeTab, setActiveTab] = useQueryState("tab", { defaultValue: "overview" });

    const {
        organizations,
        activeOrganization,
        setActiveOrganization,
        isSettingActiveOrganization,
        isLoading,
        hasError,
        organizationsError,
    } = useOrganizations();

    if (isLoading) {
        return <OrganizationPageSkeleton />;
    }

    if (hasError) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-6xl">
                <ErrorDisplay onRetry={() => window.location.reload()} error={organizationsError} />
            </div>
        )
    }

    const organization = organizations?.find(org => org.slug === slug);
    if (!organization) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-6xl">
                <OrganizationNotFound />
            </div>
        )
    }

    const isCurrentlyActive = activeOrganization?.id === organization?.id;
    const handleSetActive = () => {
        if (organization && !isCurrentlyActive) {
            setActiveOrganization(organization.id);
        }
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground cursor-pointer group"
                    asChild
                >
                    <Link href="/organizations">
                        <CaretLeftIcon size={16} className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                        <span>Back to Organizations</span>
                    </Link>
                </Button>
            </div>

            <PageHeader
                organization={organization}
                isCurrentlyActive={isCurrentlyActive}
                onSetActive={handleSetActive}
                isSettingActive={isSettingActiveOrganization}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="border-b relative">
                    <TabsList className="h-10 bg-transparent p-0 w-full justify-start overflow-x-auto">
                        <TabsTrigger
                            value="overview"
                            className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <ChartBarIcon size={16} className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Overview</span>
                            {activeTab === "overview" && (
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
                        <TabsTrigger
                            value="settings"
                            className="text-xs sm:text-sm h-10 px-2 sm:px-4 rounded-none touch-manipulation hover:bg-muted/50 relative transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <GearIcon size={16} className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Settings</span>
                            {activeTab === "settings" && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded" />
                            )}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="transition-all duration-200 animate-fadeIn">
                    <Suspense fallback={<OrganizationPageSkeleton />}>
                        <OverviewTab organization={organization} />
                    </Suspense>
                </TabsContent>

                <TabsContent value="teams" className="transition-all duration-200 animate-fadeIn">
                    <Suspense fallback={<OrganizationPageSkeleton />}>
                        <TeamsTab organization={organization} />
                    </Suspense>
                </TabsContent>

                <TabsContent value="settings" className="transition-all duration-200 animate-fadeIn">
                    <Suspense fallback={<OrganizationPageSkeleton />}>
                        <SettingsTab organization={organization} />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
} 