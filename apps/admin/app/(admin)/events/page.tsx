import { Suspense } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  ChevronDown,
  Filter,
  Globe,
  User,
  MonitorSmartphone,
  MapPin,
  Browser,
  Calendar,
} from "lucide-react";
import { fetchEvents, type ClickhouseEvent } from "./actions";
import { EventFilters, PageSizeSelector } from "./client";
import { EventRow, EventRowSkeleton } from "./EventRow";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const DEFAULT_PAGE_SIZE = 25;

function tryParseJSON(str: string) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
}

async function EventsList({
  pageSize = DEFAULT_PAGE_SIZE,
  page = 0,
  searchParams = {},
}: {
  pageSize?: number;
  page?: number;
  searchParams?: {
    search?: string;
    from?: string;
    to?: string;
    client_id?: string;
    event_name?: string;
  };
}) {
  const offset = page * pageSize;
  const { data, total, error } = await fetchEvents({
    ...searchParams,
    limit: pageSize,
    offset,
  });

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Events</CardTitle>
          <CardDescription>
            There was a problem fetching the events data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="rounded-md border bg-card overflow-x-auto">
      <div className="flex items-center justify-between px-2 py-2 border-b bg-muted/40">
        <p className="text-xs text-muted-foreground">
          Showing {offset + 1} to {Math.min(offset + pageSize, total)} of {total} events
        </p>
        <PageSizeSelector />
      </div>
      <div>
        {data.length > 0 ? (
          data.map((event) => <EventRow key={event.id} event={event} />)
        ) : (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No events found matching your criteria.
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="border-t bg-muted/40">
          <Pagination className="py-2">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={page > 0 ? `/events?page=${page - 1}&pageSize=${pageSize}` : "#"}
                  aria-disabled={page === 0}
                  className={page === 0 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum = i;
                if (totalPages > 5) {
                  if (page < 3) {
                    pageNum = i;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                }
                return (
                  <PaginationItem key={`page-${pageNum}`}>
                    <PaginationLink
                      href={`/events?page=${pageNum}&pageSize=${pageSize}`}
                      isActive={pageNum === page}
                    >
                      {pageNum + 1}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  href={page < totalPages - 1 ? `/events?page=${page + 1}&pageSize=${pageSize}` : "#"}
                  aria-disabled={page >= totalPages - 1}
                  className={page >= totalPages - 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

export default async function EventsPage({
  searchParams
}: Promise<{
  searchParams: {
    page?: string;
    pageSize?: string;
    search?: string;
    from?: string;
    to?: string;
    client_id?: string;
    event_name?: string;
   }
}>) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 0;
  const pageSize = params.pageSize ? Number.parseInt(params.pageSize, 10) : DEFAULT_PAGE_SIZE;
  const filters = {
    search: searchParams.search,
    from: searchParams.from,
    to: searchParams.to,
    client_id: searchParams.client_id,
    event_name: searchParams.event_name,
  };
  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-primary/5 to-muted/0 border-0 shadow-none">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 pb-2">
          <div className="flex items-center gap-4">
            <Activity className="h-10 w-10 text-primary bg-primary/10 rounded-full p-2 shadow" />
            <div>
              <CardTitle className="text-3xl font-bold mb-1">Events Explorer</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                View and analyze raw event data collected by Databuddy.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter events by various criteria to find what you're looking for.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventFilters />
        </CardContent>
      </Card>
      <Suspense
        fallback={
          <div className="rounded-md border bg-card overflow-x-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <EventRowSkeleton key={`skeleton-${i + 1}`} />
            ))}
          </div>
        }
      >
        <EventsList page={page} pageSize={pageSize} searchParams={filters} />
      </Suspense>
    </div>
  );
} 