"use client";

import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WebsiteDialog } from "@/components/website-dialog";
import type { Website } from "@/hooks/use-websites";
import { useWebsitesStore } from "@/stores/use-websites-store";

type VerifiedDomain = {
  id: string;
  name: string;
  verificationStatus: "PENDING" | "VERIFIED" | "FAILED";
};

interface WebsiteCardProps {
  website: Website;
  onUpdate: (id: string, name: string) => void;
  isUpdating: boolean;
  verifiedDomains: VerifiedDomain[];
}

export function WebsiteCard({
  website,
  onUpdate,
  isUpdating,
  verifiedDomains,
}: WebsiteCardProps) {
  const setSelectedWebsite = useWebsitesStore(state => state.setSelectedWebsite);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const domainValue = typeof website.domain === 'string' 
    ? website.domain 
    : website.domain?.name || '';

  const isLocalhost = domainValue.includes('localhost') || domainValue.includes('127.0.0.1');

  const handleOpenDialog = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedWebsite(website);
    setDialogOpen(true);
  };

  return (
    <Card className="relative overflow-hidden border-border/60 shadow-sm card-hover-effect">
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base truncate">
              {website.name || 'Unnamed Website'}
            </CardTitle>
            <CardDescription className="truncate">
              {domainValue}
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            className="h-8 w-8 p-0"
            type="button"
            onClick={handleOpenDialog}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          <Badge variant="outline" className="bg-background">
            {isLocalhost ? "Local Development" : "Website"}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button asChild variant="default" className="w-full">
          <Link href={`/websites/${website.id}`}>
            View Analytics
          </Link>
        </Button>
      </CardFooter>
      
      <WebsiteDialog
        website={website}
        verifiedDomains={verifiedDomains}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isLoading={isUpdating}
      />
    </Card>
  );
} 