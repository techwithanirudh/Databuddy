import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // For owner initials
import { Button } from "@/components/ui/button";
import { AlertCircle, Globe, MoreHorizontal, ExternalLink } from "lucide-react";
import { getAllWebsitesAsAdmin } from "./actions";
import { format } from 'date-fns';
import Link from 'next/link';
import { DataTableToolbar } from "@/components/admin/data-table-toolbar";
import { WebsiteActions } from "./website-actions";

// Define a type for the website data including owner info
interface WebsiteWithUser {
  id: string;
  name: string | null;
  domain: string | null; // Assuming this is the full display domain or subdomain.domain
  createdAt: Date | string;
  userId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
}

// Helper function to get initials (can be moved to a shared util)
const getInitials = (name: string | null | undefined) => {
  if (!name) return "U";
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default async function AdminWebsitesPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const { websites, error } = await getAllWebsitesAsAdmin();
  const search = searchParams.search?.toLowerCase() || "";

  // Filter websites based on search
  const filteredWebsites = websites?.filter((website) => {
    if (!search) return true;
    return (
      website.name?.toLowerCase().includes(search) ||
      website.domain?.toLowerCase().includes(search) ||
      website.ownerName?.toLowerCase().includes(search) ||
      website.ownerEmail?.toLowerCase().includes(search)
    );
  });

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />Error Fetching Websites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manage Websites</CardTitle>
              <CardDescription>
                Found {filteredWebsites?.length || 0} website{filteredWebsites?.length === 1 ? '' : 's'}
                {search && ` matching "${search}"`}.
              </CardDescription>
            </div>
            <DataTableToolbar placeholder="Search websites..." />
          </div>
        </CardHeader>
      </Card>

      {(!filteredWebsites || filteredWebsites.length === 0) && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {search 
                ? `No websites found matching "${search}". Try a different search term.`
                : "No websites found."}
            </p>
          </CardContent>
        </Card>
      )}

      {filteredWebsites && filteredWebsites.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Website Name</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(filteredWebsites as WebsiteWithUser[]).map((website) => (
                  <TableRow key={website.id}>
                    <TableCell className="font-medium">
                      {website.name || "Untitled Website"}
                    </TableCell>
                    <TableCell>
                      {website.domain ? (
                        <a 
                          href={`http://${website.domain}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center"
                        >
                          {website.domain} <ExternalLink className="h-3 w-3 ml-1.5 opacity-70"/>
                        </a>
                      ) : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {website.userId || website.ownerEmail ? (
                          <Link href={`/users/${encodeURIComponent(website.userId || website.ownerEmail || "")}`} className="flex items-center gap-2 group">
                            <Avatar className="h-8 w-8 text-xs group-hover:ring-2 group-hover:ring-primary">
                              <AvatarFallback>{getInitials(website.ownerName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm group-hover:underline">{website.ownerName || "Unknown User"}</div>
                            </div>
                          </Link>
                        ) : (
                          <>
                            <Avatar className="h-8 w-8 text-xs">
                              <AvatarFallback>{getInitials(website.ownerName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{website.ownerName || "Unknown User"}</div>
                            </div>
                          </>
                        )}
                        <div className="text-xs text-muted-foreground">{website.ownerEmail || "-"}</div>
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(website.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <WebsiteActions website={website} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          {filteredWebsites.length > 10 && (
            <CardContent className="pt-4 text-center">
              <TableCaption className="mt-0 py-2">Showing {filteredWebsites.length} websites. Pagination coming soon.</TableCaption>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
} 