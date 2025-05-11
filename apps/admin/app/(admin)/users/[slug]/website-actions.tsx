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
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteWebsite } from "../actions";
import { useState } from "react";
import { DeleteDialog } from "./delete-dialog";

interface Website {
  id: string;
  name: string | null;
  domain: string;
  status: 'ACTIVE' | 'HEALTHY' | 'UNHEALTHY' | 'INACTIVE' | 'PENDING';
  createdAt: string;
}

export function WebsiteActions({ website }: { website: Website }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    const result = await deleteWebsite(website.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Website deleted successfully');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Website Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="cursor-not-allowed">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Website (Soon)
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-red-600 focus:bg-red-500/10 focus:text-red-600 dark:focus:bg-red-500/20 dark:focus:text-red-500"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Website
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Website"
        description={`Are you sure you want to delete ${website.name || website.domain}? This action cannot be undone.`}
      />
    </>
  );
} 