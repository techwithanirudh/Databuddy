"use client";

import { useQueryState } from "nuqs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    UsersIcon,
    CalendarIcon,
    GlobeIcon,
    ChartBarIcon,
    BuildingsIcon,
    ClockIcon
} from "@phosphor-icons/react";
import { useOrganizationMembers } from "@/hooks/use-organizations";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface OverviewTabProps {
    organization: any;
}

export function OverviewTab({ organization }: OverviewTabProps) {
    const { members } = useOrganizationMembers(organization.id);
    const [, setActiveTab] = useQueryState("tab");

    const recentMembers = members?.slice(0, 5) || [];
    const ownerMember = members?.find(member => member.role === "owner");

    return (
        <div className="space-y-8">
            {/* Organization Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded border border-border/50 bg-muted/30">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BuildingsIcon size={16} weight="duotone" className="h-5 w-5" />
                        Organization Details
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                                <CalendarIcon size={16} className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Created</p>
                                <p className="text-sm text-muted-foreground">
                                    {dayjs(organization.createdAt).format("MMMM D, YYYY")}
                                    <span className="ml-1">({dayjs(organization.createdAt).fromNow()})</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                                <GlobeIcon size={16} className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Organization Slug</p>
                                <p className="text-sm text-muted-foreground font-mono">{organization.slug}</p>
                            </div>
                        </div>
                        {ownerMember && (
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    <UsersIcon size={16} className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Owner</p>
                                    <p className="text-sm text-muted-foreground">{ownerMember.user.name}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 rounded border border-border/50 bg-muted/30">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ChartBarIcon size={16} weight="duotone" className="h-5 w-5" />
                        Quick Stats
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Total Members</span>
                            <Badge variant="outline" className="px-2 py-1">
                                {members?.length || 0}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Admins</span>
                            <Badge variant="outline" className="px-2 py-1">
                                {members?.filter(m => m.role === "admin").length || 0}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Regular Members</span>
                            <Badge variant="outline" className="px-2 py-1">
                                {members?.filter(m => m.role === "member").length || 0}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Members */}
            <div className="p-6 rounded border border-border/50 bg-muted/30">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <UsersIcon size={16} weight="duotone" className="h-5 w-5" />
                        Recent Team Members
                    </h3>
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded"
                        onClick={() => setActiveTab("teams")}
                    >
                        View All Members
                    </Button>
                </div>

                {recentMembers.length > 0 ? (
                    <div className="space-y-3">
                        {recentMembers.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-3 rounded border border-border/50 bg-background/50"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={member.user.image || undefined} alt={member.user.name} />
                                        <AvatarFallback className="text-sm bg-accent">
                                            {member.user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm">{member.user.name}</p>
                                        <p className="text-xs text-muted-foreground">{member.user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs px-2 py-1">
                                        {member.role}
                                    </Badge>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <ClockIcon size={16} className="h-3 w-3" />
                                        {dayjs(member.createdAt).fromNow()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <UsersIcon size={32} weight="duotone" className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No team members yet</p>
                    </div>
                )}
            </div>
        </div>
    );
} 