"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronDown,
  Globe,
  User,
  MonitorSmartphone,
  MapPin,
  Browser,
  Calendar,
  Info,
  Copy as CopyIcon,
} from "lucide-react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ClickhouseEvent } from "./actions";

function tryParseJSON(str: string) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
}

function copyToClipboard(text: string) {
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(text);
  }
}

export function EventRow({ event }: { event: ClickhouseEvent }) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const properties = tryParseJSON(event.properties || "{}");
  const date = new Date(event.time);
  const timeAgo = formatDistanceToNow(date, { addSuffix: true });
  const formattedTime = date.toLocaleString();
  const eventTypeColor =
    event.event_name === "pageview"
      ? "bg-blue-100 text-blue-800"
      : event.event_name === "click"
      ? "bg-green-100 text-green-800"
      : event.event_name === "error"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-800";

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((v) => !v);
    }
  }

  function handleCopy() {
    copyToClipboard(JSON.stringify(properties, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b last:border-0">
      <button
        type="button"
        className={cn(
          "flex items-center gap-2 px-2 py-2 w-full text-left cursor-pointer hover:bg-muted/60 transition group",
          open && "bg-muted"
        )}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
      >
        <Badge
          variant="outline"
          className={cn(
            eventTypeColor,
            "min-w-[70px] text-xs font-semibold px-2 py-0.5 border-none"
          )}
        >
          {event.event_name}
        </Badge>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-muted-foreground min-w-[80px] text-left">
              {timeAgo}
            </span>
          </TooltipTrigger>
          <TooltipContent>{formattedTime}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="truncate text-xs text-foreground/90 max-w-[180px]" title={event.path}>
              {event.path}
            </span>
          </TooltipTrigger>
          <TooltipContent>{event.path}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="hidden md:inline text-xs text-muted-foreground max-w-[120px] truncate" title={event.client_id}>
              <Globe className="inline h-3 w-3 mr-1" />
              {event.client_id}
            </span>
          </TooltipTrigger>
          <TooltipContent>{event.client_id}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="hidden md:inline text-xs text-muted-foreground max-w-[120px] truncate" title={event.session_id}>
              <User className="inline h-3 w-3 mr-1" />
              {event.session_id}
            </span>
          </TooltipTrigger>
          <TooltipContent>{event.session_id}</TooltipContent>
        </Tooltip>
        <span className="ml-auto flex items-center gap-1">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground hidden md:inline">Details</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </span>
      </button>
      <CollapsibleContent asChild>
        <div className="bg-background/80 shadow-lg px-6 py-5 border-t animate-in fade-in slide-in-from-top-2 rounded-b-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="font-semibold text-xs text-primary mb-2">Event Details</div>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">ID:</span><span className="font-mono truncate" title={event.id}>{event.id}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Type:</span><span>{event.event_name}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Time:</span><span>{formattedTime}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Path:</span><span className="truncate max-w-[120px]" title={event.path}>{event.path}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">URL:</span><span className="truncate max-w-[120px]" title={event.url}>{event.url}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Referrer:</span><span className="truncate max-w-[120px]" title={event.referrer || "-"}>{event.referrer || "-"}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Session:</span><span className="truncate max-w-[120px]" title={event.session_id}>{event.session_id}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Client:</span><span className="truncate max-w-[120px]" title={event.client_id}>{event.client_id}</span></div>
              </div>
            </div>
            <div>
              <div className="font-semibold text-xs text-primary mb-2">User & Device</div>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">IP:</span><span>{event.ip}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Browser:</span><span>{event.browser_name} {event.browser_version}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">OS:</span><span>{event.os_name} {event.os_version}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Device:</span><span>{event.device_type || "-"}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Screen:</span><span>{event.screen_resolution || "-"}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Language:</span><span>{event.language || "-"}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Location:</span><span>{[event.city, event.region, event.country].filter(Boolean).join(", ") || "-"}</span></div>
              </div>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-primary">Raw Properties</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={e => { e.stopPropagation(); handleCopy(); }}
                tabIndex={0}
                aria-label="Copy JSON"
              >
                <CopyIcon className="h-4 w-4" />
                <span className="sr-only">Copy JSON</span>
              </Button>
              {copied && (
                <span className="ml-2 text-xs text-green-600">Copied!</span>
              )}
            </div>
            <pre className="bg-zinc-900 text-zinc-100 rounded p-3 text-xs font-mono overflow-auto max-h-[220px] border border-zinc-800">
              {JSON.stringify(properties, null, 2)}
            </pre>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function EventRowSkeleton() {
  return (
    <div className="flex items-center gap-2 px-2 py-2 border-b">
      <Skeleton className="h-5 w-16 rounded" />
      <Skeleton className="h-4 w-20 rounded" />
      <Skeleton className="h-4 w-32 rounded" />
      <Skeleton className="h-4 w-24 rounded ml-auto" />
    </div>
  );
} 