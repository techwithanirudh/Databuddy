"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Users, 
  Eye, 
  Globe, 
  Monitor, 
  Smartphone, 
  Tablet,
  Play,
  Pause,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useBatchDynamicQuery } from "@/hooks/use-dynamic-query";
import type { DateRange } from "@/hooks/use-analytics";

interface RealtimeSession {
  session_id: string;
  visitor_id: string;
  session_start: string;
  last_activity: string;
  events_count: number;
  page_views: number;
  country: string;
  region: string;
  device_type: string;
  browser: string;
  os: string;
  current_page: string;
  referrer: string;
  duration: number;
  seconds_since_last_activity: number;
}

interface RealtimeSummary {
  active_sessions: number;
  active_visitors: number;
  total_events: number;
  page_views: number;
  errors: number;
  unique_pages: number;
}

interface RealtimeTopPage {
  name: string;
  page_views: number;
  sessions: number;
  visitors: number;
}

interface RealtimeEvent {
  event_id: string;
  time: string;
  event_name: string;
  path: string;
  session_id: string;
  visitor_id: string;
  country: string;
  device_type: string;
  browser: string;
  os: string;
  referrer: string;
  event_type: string;
}

export default function RealtimePage() {
  const params = useParams();
  const websiteId = params.id as string;
  
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    return {
      start_date: fiveMinutesAgo.toISOString(),
      end_date: now.toISOString(),
    };
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update date range every 10 seconds when auto-refresh is enabled
  const updateDateRange = () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    setDateRange({
      start_date: fiveMinutesAgo.toISOString(),
      end_date: now.toISOString(),
    });
    setLastUpdate(new Date());
  };

  // Use batch dynamic query for real-time data
  const { 
    results, 
    isLoading, 
    refetch,
    getDataForQuery,
    hasDataForQuery 
  } = useBatchDynamicQuery(
    websiteId,
    dateRange,
    [
      {
        id: "sessions",
        parameters: ["realtime_sessions"],
        limit: 50,
      },
      {
        id: "summary", 
        parameters: ["realtime_summary"],
        limit: 1,
      },
      {
        id: "top_pages",
        parameters: ["realtime_top_pages"],
        limit: 10,
      },
      {
        id: "events",
        parameters: ["realtime_events"],
        limit: 20,
      }
    ],
    {
      enabled: !!websiteId,
      refetchInterval: isAutoRefresh ? 10000 : false, // Auto-refresh every 10 seconds
      refetchIntervalInBackground: false,
    }
  );

  // Extract data from results
  const sessions = getDataForQuery("sessions", "realtime_sessions") as RealtimeSession[];
  const summary = getDataForQuery("summary", "realtime_summary")?.[0] as RealtimeSummary | undefined;
  const topPages = getDataForQuery("top_pages", "realtime_top_pages") as RealtimeTopPage[];
  const recentEvents = getDataForQuery("events", "realtime_events") as RealtimeEvent[];

  // Manual refresh function
  const handleManualRefresh = () => {
    updateDateRange();
    refetch();
  };

  useEffect(() => {
    if (isAutoRefresh) {
      intervalRef.current = setInterval(updateDateRange, 10000); // Update date range every 10 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoRefresh]);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-3 w-3" />;
      case 'tablet':
        return <Tablet className="h-3 w-3" />;
      default:
        return <Monitor className="h-3 w-3" />;
    }
  };

  const getActivityStatus = (secondsSinceLastActivity: number) => {
    if (secondsSinceLastActivity < 30) {
      return { status: 'active', color: 'bg-green-500', text: 'Active now' };
    } else if (secondsSinceLastActivity < 120) {
      return { status: 'recent', color: 'bg-yellow-500', text: `${secondsSinceLastActivity}s ago` };
    } else {
      return { status: 'idle', color: 'bg-gray-400', text: `${Math.floor(secondsSinceLastActivity / 60)}m ago` };
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Activity className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Real-time Activity</h1>
            <p className="text-sm text-muted-foreground">
              Live sessions and events from the last 5 minutes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={cn(
              "flex items-center gap-2",
              isAutoRefresh && "bg-green-50 border-green-200 text-green-700"
            )}
          >
            {isAutoRefresh ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {isAutoRefresh ? "Pause" : "Resume"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="rounded">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Active Sessions</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <p className="text-lg font-semibold">{summary?.active_sessions || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Active Visitors</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <p className="text-lg font-semibold">{summary?.active_visitors || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">Page Views</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <p className="text-lg font-semibold">{summary?.page_views || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total Events</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <p className="text-lg font-semibold">{summary?.total_events || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-xs text-muted-foreground">Errors</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <p className="text-lg font-semibold">{summary?.errors || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-600" />
              <div>
                <p className="text-xs text-muted-foreground">Unique Pages</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <p className="text-lg font-semibold">{summary?.unique_pages || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden min-h-0">
        {/* Active Sessions */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden rounded">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Sessions
              {sessions && sessions.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {sessions.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <div className="overflow-y-auto max-h-full">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border-b">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-2 w-2 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : sessions && sessions.length > 0 ? (
                <div>
                  {sessions.map((session) => {
                    const activity = getActivityStatus(session.seconds_since_last_activity);
                    return (
                      <div key={session.session_id} className="flex items-center justify-between p-3 border-b border-border/20 hover:bg-muted/50">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={cn("h-2 w-2 rounded-full", activity.color)} />
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(session.device_type)}
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">
                                {session.current_page || '/'}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <span>{session.country || 'Unknown'}</span>
                                <span>•</span>
                                <span>{session.browser}</span>
                                <span>•</span>
                                <span>{activity.text}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-medium">
                            {session.page_views} views
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDuration(session.duration)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No active sessions</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Top Pages */}
          <Card className="rounded">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Top Pages (5min)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-48 overflow-y-auto">
                {isLoading ? (
                  <div className="space-y-2 p-4">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                    ))}
                  </div>
                ) : topPages && topPages.length > 0 ? (
                  <div>
                    {topPages.slice(0, 5).map((page, index) => (
                      <div key={page.name} className="flex items-center justify-between p-3 border-b border-border/20 last:border-b-0">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">
                            {page.name || '/'}
                          </div>
                        </div>
                        <div className="text-sm font-semibold">
                          {page.page_views}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No page views
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Events */}
          <Card className="rounded">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Recent Events</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="space-y-2 p-4">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="space-y-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ))}
                  </div>
                ) : recentEvents && recentEvents.length > 0 ? (
                  <div>
                    {recentEvents.slice(0, 10).map((event) => (
                      <div key={event.event_id} className="p-3 border-b border-border/20 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            {new Date(event.time).toLocaleTimeString()}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {event.event_type}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium truncate mt-1">
                          {event.path || '/'}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          {event.country} • {getDeviceIcon(event.device_type)} {event.device_type}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No recent events
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 