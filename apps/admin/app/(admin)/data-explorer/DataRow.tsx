import { formatDistanceToNow } from "date-fns";
import { Globe, Users, Clock, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReferrerData } from "./actions";

export function DataRow({ data }: { data: ReferrerData }) {
  return (
    <Card className="p-4 hover:bg-muted/50 transition-colors">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-muted-foreground mt-1" />
            <div>
              <h3 className="font-medium">{data.referrer}</h3>
              <p className="text-sm text-muted-foreground">
                {data.count.toLocaleString()} total visits
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="ml-2">
            {data.unique_users.toLocaleString()} unique users
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {Math.round(data.avg_time_on_site / 60)} min avg. time
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {Math.round(data.bounce_rate)}% bounce rate
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function DataRowSkeleton() {
  return (
    <Card className="p-4 animate-pulse">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 rounded-full bg-muted" />
            <div>
              <div className="h-4 w-48 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded mt-2" />
            </div>
          </div>
          <div className="h-6 w-24 bg-muted rounded" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-muted" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-muted" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        </div>
      </div>
    </Card>
  );
} 