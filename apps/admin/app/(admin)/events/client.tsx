"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, Search, Calendar, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
    client_id: searchParams.get("client_id") || "",
    event_name: searchParams.get("event_name") || "",
  });

  // Function to update URL with filters
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    // Only add non-empty filters to the URL
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        params.set(key, value);
      }
    }
    
    // Always reset to page 0 when filtering
    params.set("page", "0");
    
    // Preserve the page size if it exists
    const pageSize = searchParams.get("pageSize");
    if (pageSize) {
      params.set("pageSize", pageSize);
    }
    
    router.push(`/events?${params.toString()}`);
  };

  // Update a single filter
  const updateFilter = (key: keyof typeof filters) => (value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      search: "",
      from: "",
      to: "",
      client_id: "",
      event_name: "",
    });
    
    // Preserve only the page size in the URL
    const params = new URLSearchParams();
    const pageSize = searchParams.get("pageSize");
    if (pageSize) {
      params.set("pageSize", pageSize);
    }
    params.set("page", "0");
    
    router.push(`/events?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end">
      <div className="grid gap-1.5">
        <Label htmlFor="search">Search</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            type="search"
            placeholder="Search events..."
            className="pl-8"
            value={filters.search}
            onChange={(e) => updateFilter("search")(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid gap-1.5">
        <Label htmlFor="event_name">Event Type</Label>
        <Select 
          value={filters.event_name || "all"}
          onValueChange={value => updateFilter("event_name")(value === "all" ? "" : value)}
        >
          <SelectTrigger id="event_name" className="w-full md:w-[180px]">
            <SelectValue placeholder="All events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            <SelectItem value="pageview">Pageview</SelectItem>
            <SelectItem value="click">Click</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid gap-1.5">
        <Label htmlFor="date_from">From Date</Label>
        <div className="relative">
          <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="date_from"
            type="date"
            className="pl-8"
            value={filters.from}
            onChange={(e) => updateFilter("from")(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid gap-1.5">
        <Label htmlFor="date_to">To Date</Label>
        <div className="relative">
          <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="date_to"
            type="date"
            className="pl-8"
            value={filters.to}
            onChange={(e) => updateFilter("to")(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid gap-1.5">
        <Label htmlFor="client_id">Website ID</Label>
        <div className="relative">
          <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="client_id"
            placeholder="Website ID"
            className="pl-8"
            value={filters.client_id}
            onChange={(e) => updateFilter("client_id")(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button variant="default" onClick={applyFilters}>
          Apply Filters
        </Button>
        
        <Button variant="outline" size="icon" onClick={resetFilters}>
          <RotateCcw className="h-4 w-4" />
          <span className="sr-only">Reset filters</span>
        </Button>
      </div>
    </div>
  );
}

export function PageSizeSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const pageSize = searchParams.get("pageSize") || "25";
  
  const handlePageSizeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", value);
    params.set("page", "0"); // Reset to first page when changing page size
    router.push(`/events?${params.toString()}`);
  };
  
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="pageSize" className="text-sm">Show</Label>
      <Select
        value={pageSize}
        onValueChange={handlePageSizeChange}
      >
        <SelectTrigger id="pageSize" className="h-8 w-[70px]">
          <SelectValue placeholder={pageSize} />
        </SelectTrigger>
        <SelectContent side="top">
          {[10, 25, 50, 100].map((size) => (
            <SelectItem key={size} value={size.toString()}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 