"use client";
import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { updateWebsiteName, deleteWebsite } from "./actions";

export function WebsiteActions({ website }: { website: { id: string; name: string | null } }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(website.name || "");
  const [loading, setLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  async function handleEdit() {
    setLoading(true);
    await updateWebsiteName(website.id, name);
    setLoading(false);
    setEditing(false);
  }

  async function handleDelete() {
    setLoading(true);
    await deleteWebsite(website.id);
    setLoading(false);
    setShowDelete(false);
  }

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-40 h-8 text-sm"
            disabled={loading}
            autoFocus
          />
          <Button size="icon" variant="ghost" onClick={handleEdit} disabled={loading || !name.trim()} aria-label="Save">
            <Check className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => { setEditing(false); setName(website.name || ""); }} aria-label="Cancel">
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <Button size="icon" variant="ghost" onClick={() => setEditing(true)} aria-label="Edit name">
            <Pencil className="h-4 w-4" />
          </Button>
          <Dialog open={showDelete} onOpenChange={setShowDelete}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Delete website">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Website</DialogTitle>
              </DialogHeader>
              <div>Are you sure you want to delete this website? This action cannot be undone.</div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setShowDelete(false)} disabled={loading}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={loading}>Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
} 