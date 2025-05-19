"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";

export function DataExplorerFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: searchParams.get("from") ? new Date(searchParams.get("from") as string) : undefined,
    to: searchParams.get("to") ? new Date(searchParams.get("to") as string) : undefined,
  });

  const updateFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set("search", search);
    else params.delete("search");
    if (dateRange.from) params.set("from", dateRange.from.toISOString());
    else params.delete("from");
    if (dateRange.to) params.set("to", dateRange.to.toISOString());
    else params.delete("to");
    params.set("page", "0");
    router.push(`/data-explorer?${params.toString()}`);
  }, [search, dateRange, router, searchParams]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search referrers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
              onKeyDown={(e) => e.key === "Enter" && updateFilters()}
            />
          </div>
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={(value) => setDateRange(value)}
          className="w-full sm:w-auto"
        />
        <Button onClick={updateFilters} className="w-full sm:w-auto">
          <Filter className="mr-2 h-4 w-4" />
          Apply Filters
        </Button>
      </div>
    </div>
  );
}

export function PageSizeSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPageSize = Number(searchParams.get("pageSize") || "25");

  const updatePageSize = (size: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", size);
    params.set("page", "0");
    router.push(`/data-explorer?${params.toString()}`);
  };

  return (
    <Select
      value={currentPageSize.toString()}
      onValueChange={updatePageSize}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select page size" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="10">10 per page</SelectItem>
        <SelectItem value="25">25 per page</SelectItem>
        <SelectItem value="50">50 per page</SelectItem>
        <SelectItem value="100">100 per page</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function SortSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort_by") || "count";
  const currentOrder = searchParams.get("sort_order") || "desc";

  const updateSort = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort_by", sort);
    params.set("sort_order", currentOrder);
    router.push(`/data-explorer?${params.toString()}`);
  };

  const toggleOrder = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort_order", currentOrder === "desc" ? "asc" : "desc");
    router.push(`/data-explorer?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={currentSort} onValueChange={updateSort}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="count">Total Visits</SelectItem>
          <SelectItem value="unique_users">Unique Users</SelectItem>
          <SelectItem value="avg_time_on_site">Avg. Time on Site</SelectItem>
          <SelectItem value="bounce_rate">Bounce Rate</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" size="icon" onClick={toggleOrder}>
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    </div>
  );
} 