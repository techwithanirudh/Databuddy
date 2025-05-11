import { getAllDomainsAsAdmin } from "./actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ExternalLink, BadgeCheck, AlertCircle, ShieldQuestion, Globe, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { DataTableToolbar } from "@/components/admin/data-table-toolbar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface DomainEntry {
  id: string;
  name: string | null;
  verifiedAt: string | null;
  verificationStatus: string | null;
  createdAt: string;
  userId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerImage: string | null;
  websiteName: string | null;
  websiteId: string | null;
}

// Group domains by their base domain (e.g., example.com for sub.example.com)
function groupDomainsByBase(domains: DomainEntry[]) {
  const groups = new Map<string, DomainEntry[]>();
  
  for (const domain of domains) {
    if (!domain.name) continue;
    
    // Extract base domain (e.g., example.com from sub.example.com)
    const parts = domain.name.split('.');
    const baseDomain = parts.length > 2 ? parts.slice(-2).join('.') : domain.name;
    
    if (!groups.has(baseDomain)) {
      groups.set(baseDomain, []);
    }
    groups.get(baseDomain)?.push(domain);
  }
  
  return Array.from(groups.entries()).map(([baseDomain, domains]) => ({
    baseDomain,
    domains: domains.sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    mainDomain: domains.find(d => d.name === baseDomain) || domains[0],
  }));
}

export default async function AdminDomainsPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const { domains, error } = await getAllDomainsAsAdmin();
  const search = searchParams.search?.toLowerCase() || "";

  // Filter domains based on search
  const filteredDomains = domains?.filter((domain) => {
    if (!search) return true;
    return (
      domain.name?.toLowerCase().includes(search) ||
      domain.ownerName?.toLowerCase().includes(search) ||
      domain.ownerEmail?.toLowerCase().includes(search) ||
      domain.websiteName?.toLowerCase().includes(search)
    );
  });

  // Group domains after filtering
  const groupedDomains = filteredDomains ? groupDomainsByBase(filteredDomains) : [];

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Could not load domains.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Manage Domains</CardTitle>
            <CardDescription>
              Found {groupedDomains.length} domain group{groupedDomains.length === 1 ? '' : 's'}
              {search && ` matching "${search}"`}.
            </CardDescription>
          </div>
          <DataTableToolbar placeholder="Search domains..." />
        </div>
      </CardHeader>
      <CardContent>
        {(!groupedDomains || groupedDomains.length === 0) ? (
          <div className="p-8 border rounded-lg bg-muted/20">
            <p className="text-center text-muted-foreground">
              {search 
                ? `No domains found matching "${search}". Try a different search term.`
                : "No domains found."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {groupedDomains.map(({ baseDomain, domains, mainDomain }) => (
              <Collapsible key={`${baseDomain}-${mainDomain.id}`} className="border rounded-lg">
                <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">{baseDomain}</h3>
                      <p className="text-sm text-muted-foreground">
                        {domains.length} subdomain{domains.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {mainDomain.verifiedAt ? (
                      <Badge variant="default" className="bg-green-500/10 text-green-700 border border-green-500/20">
                        <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                        Verified
                      </Badge>
                    ) : mainDomain.verificationStatus === "PENDING" ? (
                      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border border-yellow-500/20">
                        <ShieldQuestion className="mr-1 h-3.5 w-3.5" />
                        Pending
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="px-2 py-0.5 text-xs">
                        <AlertCircle className="mr-1 h-3.5 w-3.5" />
                        {mainDomain.verificationStatus || "Unknown"}
                      </Badge>
                    )}
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subdomain</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Website</TableHead>
                        <TableHead>Added</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {domains.map((domain) => (
                        <TableRow key={domain.id}>
                          <TableCell>
                            <a
                              href={`http://${domain.name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:underline flex items-center"
                            >
                              {domain.name}
                              <ExternalLink className="ml-1 h-3.5 w-3.5" />
                            </a>
                          </TableCell>
                          <TableCell>
                            {domain.verifiedAt ? (
                              <Badge variant="default" className="bg-green-500/10 text-green-700 border border-green-500/20">
                                <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                                Verified
                              </Badge>
                            ) : domain.verificationStatus === "PENDING" ? (
                              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border border-yellow-500/20">
                                <ShieldQuestion className="mr-1 h-3.5 w-3.5" />
                                Pending
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="px-2 py-0.5 text-xs">
                                <AlertCircle className="mr-1 h-3.5 w-3.5" />
                                {domain.verificationStatus || "Unknown"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {domain.userId || domain.ownerEmail ? (
                              <Link href={`/users/${encodeURIComponent(domain.userId || domain.ownerEmail || "")}`} className="flex items-center gap-2 group">
                                <Avatar className="h-8 w-8 text-xs group-hover:ring-2 group-hover:ring-primary">
                                  <AvatarImage src={domain.ownerImage || undefined} alt={domain.ownerName || "User"} />
                                  <AvatarFallback>{getInitials(domain.ownerName)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-sm group-hover:underline">{domain.ownerName || "Unknown User"}</div>
                                </div>
                              </Link>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 text-xs">
                                  <AvatarFallback>?</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-sm">Unknown User</div>
                                </div>
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">{domain.ownerEmail || "-"}</div>
                          </TableCell>
                          <TableCell>
                            {domain.websiteName ? (
                              <Link 
                                href={`/websites/${domain.websiteId}`}
                                className="hover:underline"
                              >
                                {domain.websiteName}
                              </Link>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(domain.createdAt), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 