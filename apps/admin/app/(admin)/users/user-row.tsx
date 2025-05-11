'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { AlertCircle, BadgeCheck, MoreHorizontal } from "lucide-react";
import { format } from 'date-fns';
import Link from 'next/link';
import { getInitials } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date | string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
}

export function UserRow({ user }: { user: User }) {
  return (
    <TableRow>
      <TableCell className="pl-6">
        <Link href={`/users/${user.id}`} className="group">
          <Avatar className="h-8 w-8 text-xs group-hover:ring-2 group-hover:ring-primary">
            <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
            <AvatarFallback>{getInitials(user.name || user.email)}</AvatarFallback>
          </Avatar>
        </Link>
      </TableCell>
      <TableCell>
        <Link href={`/users/${user.id}`} className="group">
          <div className="font-medium text-sm group-hover:underline">
            {user.name || "Unnamed User"}
          </div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </Link>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={user.emailVerified ? "default" : "secondary"} className="gap-1">
          {user.emailVerified ? (
            <>
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified
            </>
          ) : (
            <>
              <AlertCircle className="h-3.5 w-3.5" />
              Unverified
            </>
          )}
        </Badge>
      </TableCell>
      <TableCell>
        {format(new Date(user.createdAt), "MMM d, yyyy")}
      </TableCell>
      <TableCell className="text-right pr-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/users/${user.id}`}>
                View Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              Edit User
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              {user.status === 'ACTIVE' ? 'Suspend User' : 'Reactivate User'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
} 