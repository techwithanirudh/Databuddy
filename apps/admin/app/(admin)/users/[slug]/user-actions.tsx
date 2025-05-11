'use client';

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  ChevronDown,
  Edit,
  Mail,
  MoreHorizontal,
  ShieldAlert,
  UserCog,
} from "lucide-react";
import { updateUserStatus, updateUserRole } from "../actions";

interface UserActionsProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    emailVerified: boolean;
    image: string | null;
    firstName: string | null;
    lastName: string | null;
    status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    role: 'USER' | 'ADMIN';
    twoFactorEnabled: boolean | null;
    domains: Array<{
      id: string;
      name: string;
      verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
      verifiedAt: string | null;
      createdAt: string;
    }>;
    websites: Array<{
      id: string;
      name: string | null;
      domain: string;
      status: 'ACTIVE' | 'HEALTHY' | 'UNHEALTHY' | 'INACTIVE' | 'PENDING';
      createdAt: string;
    }>;
    projects: Array<{
      id: string;
      name: string;
      slug: string;
      type: 'WEBSITE' | 'MOBILE_APP' | 'DESKTOP_APP' | 'API';
      status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
      createdAt: string;
    }>;
  };
}

export function UserActions({ user }: UserActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="gap-2">
        <Mail className="h-4 w-4" />
        Contact
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <UserCog className="mr-2 h-4 w-4" />
            Manage Access
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.status === 'SUSPENDED' ? (
            <DropdownMenuItem 
              className="text-green-600"
              onClick={async () => {
                const result = await updateUserStatus(user.id, 'ACTIVE');
                if (result.error) {
                  toast.error(result.error);
                } else {
                  toast.success('User account reactivated successfully');
                }
              }}
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              Reactivate Account
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem 
              className="text-red-600"
              onClick={async () => {
                const result = await updateUserStatus(user.id, 'SUSPENDED');
                if (result.error) {
                  toast.error(result.error);
                } else {
                  toast.success('User suspended successfully');
                }
              }}
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              Suspend Account
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function RoleActions({ user }: UserActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {user.role}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={async () => {
            const result = await updateUserRole(user.id, 'USER');
            if (result.error) {
              toast.error(result.error);
            } else {
              toast.success('Role updated to User');
            }
          }}
        >
          User
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            const result = await updateUserRole(user.id, 'ADMIN');
            if (result.error) {
              toast.error(result.error);
            } else {
              toast.success('Role updated to Admin');
            }
          }}
        >
          Admin
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 