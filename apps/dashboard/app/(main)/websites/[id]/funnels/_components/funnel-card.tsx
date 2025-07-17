"use client";

import {
  CaretDownIcon,
  CaretUpIcon,
  CaretRightIcon,
  PencilIcon,
  TrashIcon,
  FileTextIcon,
  FunnelIcon,
  MouseRightClickIcon,
  DotsThreeIcon,
} from "@phosphor-icons/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Funnel } from "@/hooks/use-funnels";

interface FunnelCardProps {
  funnel: Funnel;
  isExpanded: boolean;
  onToggle: (funnelId: string) => void;
  onEdit: (funnel: Funnel) => void;
  onDelete: (funnelId: string) => void;
  children?: React.ReactNode;
}

export function FunnelCard({
  funnel,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  children,
}: FunnelCardProps) {
  // Make the entire card clickable
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent toggling if clicking on a button inside the card
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    onToggle(funnel.id);
  };

  return (
    <Card
      className="mb-4 border bg-background rounded overflow-hidden cursor-pointer select-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { onToggle(funnel.id); } }}
      style={{ outline: "none" }}
    >
      <div className="flex items-center justify-between px-4 py-3 gap-2 sm:px-6">
        <div className="flex flex-col flex-grow text-left">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-base truncate mr-2" style={{ color: "var(--color-foreground)" }}>
              {funnel.name}
            </h3>
            {(funnel.steps || []).map((step, index) => (
              <div key={step.name + step.type + step.target} className="flex items-center">
                {index > 0 && (
                  <CaretRightIcon className="h-3 w-3 mx-1" style={{ color: "var(--color-muted-foreground)" }} weight="fill" />
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="rounded flex items-center gap-1 px-2 py-0.5 border text-xs"
                        style={{ background: "var(--color-muted)", color: "var(--color-foreground)", borderColor: "var(--color-border)" }}
                      >
                        {step.type === "PAGE_VIEW" ? (
                          <FileTextIcon className="h-3 w-3 mr-1" style={{ color: "var(--color-primary)" }} weight="duotone" />
                        ) : step.type === "EVENT" ? (
                          <MouseRightClickIcon className="h-3 w-3 mr-1" style={{ color: "var(--color-warning)" }} weight="duotone" />
                        ) : (
                          <DotsThreeIcon className="h-3 w-3 mr-1" style={{ color: "var(--color-muted-foreground)" }} weight="duotone" />
                        )}
                        <span className="max-w-[120px] overflow-hidden text-ellipsis inline-block">
                          {step.name || step.target}
                        </span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs px-2 py-1">
                      {step.type === "PAGE_VIEW"
                        ? `Page: ${step.target}`
                        : step.type === "EVENT"
                          ? `Event: ${step.target}`
                          : step.target}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
          </div>
          {funnel.filters && funnel.filters.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <FunnelIcon className="h-3 w-3" style={{ color: "var(--color-muted-foreground)" }} weight="duotone" />
              <div className="flex flex-wrap gap-2">
                {funnel.filters.map((filter) => (
                  <span
                    key={filter.field + filter.operator + String(filter.value)}
                    className="rounded flex items-center gap-1 px-2 py-0.5 border text-xs"
                    style={{ background: "var(--color-muted)", color: "var(--color-foreground)", borderColor: "var(--color-border)" }}
                  >
                    <span style={{ color: "var(--color-muted-foreground)" }}>{filter.field}</span>
                    <span
                      className="mx-1"
                      style={{ color: filter.operator === "not_equals" || filter.operator === "not_in" ? "var(--color-destructive)" : "var(--color-success)" }}
                    >
                      {filter.operator}
                    </span>
                    <span className="max-w-[100px] overflow-hidden text-ellipsis inline-block" style={{ color: "var(--color-foreground)" }}>
                      {filter.value && typeof filter.value === "string" && filter.value.length > 0 ? filter.value : "empty"}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={e => {
              e.stopPropagation();
              onEdit(funnel);
            }}
            type="button"
            className="focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <PencilIcon className="h-4 w-4" weight="duotone" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={e => {
              e.stopPropagation();
              onDelete(funnel.id);
            }}
            type="button"
            className="focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <TrashIcon className="h-4 w-4" weight="duotone" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={e => {
              e.stopPropagation();
              onToggle(funnel.id);
            }}
            type="button"
            className="focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            {isExpanded ? (
              <CaretUpIcon className="h-4 w-4" weight="fill" />
            ) : (
              <CaretDownIcon className="h-4 w-4" weight="fill" />
            )}
          </Button>
        </div>
      </div>
      {isExpanded && (
        <div className="border-t border-border bg-muted/30">
          <div className="p-4">{children}</div>
        </div>
      )}
    </Card>
  );
}
