"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/once-ui/components";
import { Flex, Icon } from "@/components/once-ui/components";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { TopHeader } from "./top-header";
import { useWebsites } from "@/hooks/use-websites";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
// import { OrganizationSelector } from "./organization-selector";

// Website-specific navigation items
const websiteNavigation = [
  {
    title: "ANALYTICS",
    items: [
      { name: "Overview", icon: "helpCircle", href: "" }, // Using helpCircle as a substitute for dashboard
      // { name: "Sessions", icon: Clock, href: "/sessions" },
      // { name: "Profiles", icon: Users, href: "/profiles" },
      // { name: "Geography", icon: Map, href: "/geography" },
    ],
  },
  // {
  //   title: "ANALYSIS",
  //   items: [
  //     { name: "Funnels", icon: Filter, href: "/funnels" },
  //     { name: "Goals", icon: Target, href: "/goals" },
  //     { name: "A/B Testing", icon: TestTube, href: "/experiments" },
  //   ],
  // },
  // {
  //   title: "TRANSPARENCY",
  //   items: [
  //     { name: "Roadmap", icon: MapPin, href: "/transparency/roadmap", disabled: true },
  //     { name: "Changelog", icon: ClipboardList, href: "/transparency/changelog", disabled: true },
  //     { name: "Feedback", icon: Megaphone, href: "/transparency/feedback", disabled: true },
  //   ],
  // },
  {
    title: "ACCOUNT",
    items: [
      { name: "Settings", icon: "settings", href: "/settings" },
      { name: "Billing", icon: "creditCard", href: "/billing" }, // Need to add creditCard to iconLibrary
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { websites, isLoading } = useWebsites();

  // Check if we're on a specific website page
  const websitePathMatch = pathname.match(/^\/websites\/([^\/]+)(?:\/(.*))?$/);
  const currentWebsiteId = websitePathMatch ? websitePathMatch[1] : null;
  const currentWebsiteSubpath = websitePathMatch ? websitePathMatch[2] || "" : "";
  const isInWebsiteContext = !!currentWebsiteId;

  // Find current website details
  const currentWebsite = isInWebsiteContext 
    ? websites?.find(site => site.id === currentWebsiteId) 
    : null;

  // This effect runs once after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Top Navigation Bar */}
      <TopHeader setMobileOpen={setIsMobileOpen} />

      {/* Mobile sidebar backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-background border-r transition-transform duration-300 ease-in-out md:translate-x-0 pt-16 shadow-sm",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Navigation */}
        <div className="px-4 py-5 h-[calc(100vh-8rem)] overflow-y-auto">
          {isInWebsiteContext ? (
            // Website-specific navigation
            <>
              {/* Back to websites button */}
              <div className="mb-6">
                <Link href="/websites">
                  <Button variant="secondary" size="m" prefixIcon="chevronLeft" className="w-full justify-start mb-5">
                    <span>Back to Websites</span>
                  </Button>
                </Link>
                
                {/* Current website name */}
                <div className="px-2 py-1 mb-4">
                  <h2 className="text-base font-semibold truncate">
                    {currentWebsite?.name || currentWebsite?.domain || (
                      <Skeleton className="h-5 w-36" />
                    )}
                  </h2>
                  <div className="text-sm text-muted-foreground truncate mt-0.5">
                    {currentWebsite ? 
                      currentWebsite.domain : 
                      <Skeleton className="h-4 w-24 mt-1" />
                    }
                  </div>
                </div>
              </div>
              
              {/* Website navigation sections */}
              {websiteNavigation.map((section) => (
                <div key={section.title} className="mb-8">
                  <h3 className="px-2 mb-3 text-xs font-semibold text-muted-foreground tracking-wider">
                    {section.title}
                  </h3>
                  <div className="space-y-1.5">
                    {section.items.map((item) => {
                      const fullPath = `/websites/${currentWebsiteId}${item.href}`;
                      const isActive = item.href === "" 
                        ? pathname === `/websites/${currentWebsiteId}` 
                        : pathname === fullPath;
                      
                      return (
                        <Link
                          key={item.name}
                          href={fullPath}
                          className={cn(
                            "flex items-center gap-x-3.5 px-3 py-2.5 text-sm rounded-md transition-all focus-ring",
                            isActive
                              ? "bg-primary/10 text-primary font-medium shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          )}
                        >
                          <Icon 
                            name={item.icon} 
                            size="s" 
                            onBackground={isActive ? "brand-strong" : "neutral-medium"} 
                          />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          ) : (
            // Regular sidebar for website selection page
            <>
              <div className="mb-8">
                <Link href="/websites">
                  <Button variant="primary" size="m" prefixIcon="globe" fillWidth className="mb-5">
                    Websites
                  </Button>
                </Link>

                <div className="space-y-1.5 mt-5">
                  {isLoading ? (
                    // Loading skeletons
                    <>
                      <div className="px-2 py-2">
                        <Skeleton className="h-5 w-full rounded-md" />
                      </div>
                      <div className="px-2 py-2">
                        <Skeleton className="h-5 w-full rounded-md" />
                      </div>
                      <div className="px-2 py-2">
                        <Skeleton className="h-5 w-full rounded-md" />
                      </div>
                    </>
                  ) : websites?.length === 0 ? (
                    // No websites message
                    <div className="px-4 py-3 text-sm text-muted-foreground bg-accent/50 rounded-md">
                      No websites yet
                    </div>
                  ) : (
                    // Website list
                    <Collapsible
                      defaultOpen
                      className="space-y-1.5"
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                          <span className="font-medium">Your Websites</span>
                          <Icon name="chevronDown" size="s" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-1.5 space-y-1">
                        {websites.map((site) => (
                          <Link
                            key={site.id}
                            href={`/websites/${site.id}`}
                            className={cn(
                              "flex items-center justify-between px-3 py-2.5 text-sm rounded-md transition-all focus-ring",
                              pathname === `/websites/${site.id}`
                                ? "bg-primary/10 text-primary font-medium shadow-sm"
                                : "text-foreground hover:bg-accent/50"
                            )}
                          >
                            <span className="truncate">{site.name || site.domain}</span>
                          </Link>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </div>

              {/* Add other navigation sections here */}
              <div className="mb-8">
                <h3 className="px-2 mb-3 text-xs font-semibold text-muted-foreground tracking-wider">
                  ACCOUNT
                </h3>
                <div className="space-y-1.5">
                  <Link
                    href="/settings"
                    className={cn(
                      "flex items-center gap-x-3.5 px-3 py-2.5 text-sm rounded-md transition-all focus-ring",
                      pathname === "/settings"
                        ? "bg-primary/10 text-primary font-medium shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <Icon name="settings" size="s" onBackground={pathname === "/settings" ? "brand-strong" : "neutral-medium"} />
                    <span>Settings</span>
                  </Link>
                  <Link
                    href="/billing"
                    className={cn(
                      "flex items-center gap-x-3.5 px-3 py-2.5 text-sm rounded-md transition-all focus-ring",
                      pathname === "/billing"
                        ? "bg-primary/10 text-primary font-medium shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <Icon name="creditCard" size="s" onBackground={pathname === "/billing" ? "brand-strong" : "neutral-medium"} />
                    <span>Billing</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}   