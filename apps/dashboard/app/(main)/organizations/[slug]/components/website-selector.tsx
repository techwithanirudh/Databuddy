"use client";

import type { Website } from "@databuddy/shared";
import { GlobeIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

function WebsiteCard({
  website,
  selected,
  onClick,
}: {
  website: Website;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200",
        selected
          ? "border-primary/30 bg-primary/10 ring-2 ring-primary/20 shadow-sm"
          : "border-border/50 bg-background/50 hover:bg-muted/80 hover:border-border/70"
      )}
      onClick={onClick}
      type="button"
    >
      <div className="rounded bg-primary/10 p-1.5 flex-shrink-0">
        <GlobeIcon className="h-3.5 w-3.5 text-primary" size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate text-foreground">{website.name}</p>
        <p className="text-muted-foreground text-xs truncate">{website.domain}</p>
      </div>
    </button>
  );
}

export function WebsiteSelector({
  websites,
  selectedWebsite,
  onSelectWebsite,
}: {
  websites: Website[];
  selectedWebsite: string | null;
  onSelectWebsite: (id: string | null) => void;
}) {
  return (
    <div className="max-h-60 space-y-2 overflow-y-auto p-1">
      {websites.length > 0 ? (
        websites.map((website) => (
          <WebsiteCard
            key={website.id}
            onClick={() => onSelectWebsite(website.id === selectedWebsite ? null : website.id)}
            selected={selectedWebsite === website.id}
            website={website}
          />
        ))
      ) : (
        <div className="py-8 text-center">
          <GlobeIcon
            className="mx-auto mb-2 h-8 w-8 text-muted-foreground"
            size={32}
            weight="duotone"
          />
          <p className="text-muted-foreground text-sm">No websites found</p>
        </div>
      )}
    </div>
  );
}
