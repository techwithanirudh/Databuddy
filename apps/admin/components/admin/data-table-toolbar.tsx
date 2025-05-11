"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";

interface DataTableToolbarProps {
  placeholder?: string;
  searchKey?: string;
}

export function DataTableToolbar({
  placeholder = "Search...",
  searchKey = "search",
}: DataTableToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get(searchKey) || "");
  const debouncedSearch = useDebounce(search, 300);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  useEffect(() => {
    const query = createQueryString(searchKey, debouncedSearch);
    router.push(`${pathname}?${query}`);
  }, [debouncedSearch, createQueryString, pathname, router, searchKey]);

  const clearSearch = () => {
    setSearch("");
    router.push(pathname);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-7 w-7"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
    </div>
  );
} 