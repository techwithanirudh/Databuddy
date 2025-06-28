
import { Globe, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WebsiteDialog } from "@/components/website-dialog";
import type { CreateWebsiteData } from "@/hooks/use-websites";

interface EmptyStateProps {
  onCreateWebsite: (data: CreateWebsiteData) => void;
  isCreating: boolean;
}

export function EmptyState({
  isCreating,
}: EmptyStateProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const renderButton = () => {
    const button = (
      <Button
        disabled={isCreating}
        onClick={() => setDialogOpen(true)}
        size="lg"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Your First Website
      </Button>
    );

    return button;
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-accent/20 py-16">
      <Globe className="mb-5 h-16 w-16 text-muted-foreground opacity-80" />
      <h3 className="mb-2 font-semibold text-xl">No websites added yet</h3>
      <p className="mb-6 max-w-md text-center text-muted-foreground">
        Add your first website to start tracking analytics and insights.
      </p>

      {renderButton()}

      <WebsiteDialog
        onOpenChange={setDialogOpen}
        open={dialogOpen}
      />
    </div>
  );
}
