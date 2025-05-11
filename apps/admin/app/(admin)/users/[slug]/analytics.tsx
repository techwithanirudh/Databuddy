'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, AlertCircle, Clock, Globe, MapPin, Info } from "lucide-react";
import { format } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface AnalyticsProps {
  data: {
    error?: string;
    totalStats?: {
      total_events: number;
      total_websites: number;
      total_sessions: number;
      total_visitors: number;
      avg_session_duration: number;
      bounce_rate: number;
    };
    eventsPerWebsite?: Array<{
      website_id: string;
      website_name: string;
      event_count: number;
      session_count: number;
      visitor_count: number;
      avg_time_on_page: number;
      first_event: string;
      last_event: string;
    }>;
    eventsPerDay?: Array<{
      date: string;
      event_count: number;
      session_count: number;
      visitor_count: number;
      avg_time_on_page: number;
    }>;
    topEventTypes?: Array<{
      event_name: string;
      count: number;
      unique_users: number;
      avg_time_on_page: number;
    }>;
    deviceStats?: Array<{
      device_type: string;
      browser_name: string;
      count: number;
      percentage: number;
    }>;
    locationStats?: Array<{
      country: string;
      region: string;
      count: number;
      percentage: number;
    }>;
  };
}

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed'];

function safeToFixed(value: number | null | undefined, digits = 1) {
  return typeof value === 'number' && !Number.isNaN(value) ? value.toFixed(digits) : '0.0';
}
function formatNumber(val: number | null | undefined) {
  return typeof val === 'number' && !Number.isNaN(val) ? val.toLocaleString() : '0';
}
function formatPercent(val: number | null | undefined, digits = 1) {
  return typeof val === 'number' && !Number.isNaN(val) ? `${val.toFixed(digits)}%` : '0.0%';
}
function formatDateString(val: string | null | undefined) {
  if (!val) return 'N/A';
  try {
    return format(new Date(val), 'MMM d, yyyy');
  } catch {
    return val;
  }
}

export function Analytics({ data }: AnalyticsProps) {
  if (data.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Error Loading Analytics
          </CardTitle>
          <CardDescription>{data.error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data.totalStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Analytics Data</CardTitle>
          <CardDescription>This user has no analytics data yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-8">
      {/* Summary Cards */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md border-2 border-primary/10 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-6 rounded-t-xl">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Total Events</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Total number of tracked events across all websites.</TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent className="p-6 rounded-b-xl">
            <div className="text-3xl font-bold text-primary">{formatNumber(data.totalStats.total_events)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across <span className="font-semibold">{formatNumber(data.totalStats.total_websites)}</span> websites
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-md border-2 border-green-500/10 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-6 rounded-t-xl">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <CardTitle className="text-base font-semibold">Total Visitors</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Unique visitors across all websites.</TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent className="p-6 rounded-b-xl">
            <div className="text-3xl font-bold text-green-700">{formatNumber(data.totalStats.total_visitors)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold">{formatNumber(data.totalStats.total_sessions)}</span> sessions
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-md border-2 border-blue-500/10 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-6 rounded-t-xl">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base font-semibold">Avg. Session</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Average session duration in minutes.</TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent className="p-6 rounded-b-xl">
            <div className="text-3xl font-bold text-blue-700">
              {Math.round((data.totalStats.avg_session_duration || 0) / 60)}m
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatPercent(data.totalStats.bounce_rate)} bounce rate
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-md border-2 border-purple-500/10 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-6 rounded-t-xl">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-base font-semibold">Active Websites</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Websites with tracked events.</TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent className="p-6 rounded-b-xl">
            <div className="text-3xl font-bold text-purple-700">{formatNumber(data.totalStats.total_websites)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tracking events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Events Over Time */}
      <Card className="shadow-md rounded-xl">
        <CardHeader className="p-6 rounded-t-xl">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Events Over Time</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>Daily metrics for the last 30 days.</TooltipContent>
            </Tooltip>
          </div>
          <CardDescription>Daily metrics for the last 30 days</CardDescription>
        </CardHeader>
        <CardContent className="p-6 rounded-b-xl bg-muted/40">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={data.eventsPerDay} margin={{ top: 20, right: 40, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => formatDateString(date)}
                  fontSize={14}
                  padding={{ left: 10, right: 10 }}
                  label={{ value: 'Date', position: 'insideBottom', offset: -10 }}
                />
                <YAxis fontSize={14} label={{ value: 'Count', angle: -90, position: 'insideLeft', offset: 10 }} />
                <RechartsTooltip contentStyle={{ borderRadius: 8, background: '#fff', boxShadow: '0 2px 8px #0001' }}
                  labelFormatter={(date) => formatDateString(date)}
                  formatter={(value: number, name: string) => [
                    formatNumber(value),
                    name === "event_count" ? "Events" :
                    name === "session_count" ? "Sessions" :
                    name === "visitor_count" ? "Visitors" : name
                  ]}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line 
                  type="monotone" 
                  dataKey="event_count" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  name="Events"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="session_count" 
                  stroke="#16a34a" 
                  strokeWidth={2}
                  name="Sessions"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="visitor_count" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                  name="Visitors"
                  dot={false}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Events Per Website */}
      <Card className="shadow-md rounded-xl">
        <CardHeader className="p-6 rounded-t-xl">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Events Per Website</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>Total events and sessions per website.</TooltipContent>
            </Tooltip>
          </div>
          <CardDescription>Total events and sessions per website</CardDescription>
        </CardHeader>
        <CardContent className="p-6 rounded-b-xl bg-muted/40">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.eventsPerWebsite} margin={{ top: 20, right: 40, left: 0, bottom: 20 }} barCategoryGap={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="website_name" 
                  tickFormatter={(name) => name || "Unnamed"}
                  fontSize={14}
                  padding={{ left: 10, right: 10 }}
                  label={{ value: 'Website', position: 'insideBottom', offset: -10 }}
                />
                <YAxis fontSize={14} label={{ value: 'Count', angle: -90, position: 'insideLeft', offset: 10 }} />
                <RechartsTooltip contentStyle={{ borderRadius: 8, background: '#fff', boxShadow: '0 2px 8px #0001' }}
                  formatter={(value: number, name: string) => [
                    formatNumber(value),
                    name === "event_count" ? "Events" :
                    name === "session_count" ? "Sessions" :
                    name === "visitor_count" ? "Visitors" : name
                  ]}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="event_count" fill="#2563eb" name="Events" radius={[8, 8, 0, 0]} barSize={24} />
                <Bar dataKey="session_count" fill="#16a34a" name="Sessions" radius={[8, 8, 0, 0]} barSize={24} />
                <Bar dataKey="visitor_count" fill="#dc2626" name="Visitors" radius={[8, 8, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Top Event Types */}
        <Card className="shadow-md rounded-xl">
          <CardHeader className="p-6 rounded-t-xl">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">Top Event Types</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Most common event types.</TooltipContent>
              </Tooltip>
            </div>
            <CardDescription>Most common event types</CardDescription>
          </CardHeader>
          <CardContent className="p-6 rounded-b-xl">
            <div className="space-y-4">
              {data.topEventTypes?.length ? data.topEventTypes.map((event) => (
                <div key={event.event_name} className="flex items-center justify-between border-b last:border-b-0 pb-2 last:pb-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{event.event_name}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(event.unique_users)} users
                    </span>
                  </div>
                  <div className="text-sm font-medium">
                    {formatNumber(event.count)} events
                  </div>
                </div>
              )) : <div className="text-muted-foreground text-sm">No event data.</div>}
            </div>
          </CardContent>
        </Card>

        {/* Device Stats */}
        <Card className="shadow-md rounded-xl">
          <CardHeader className="p-6 rounded-t-xl">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">Device & Browser Stats</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Top devices and browsers.</TooltipContent>
              </Tooltip>
            </div>
            <CardDescription>Top devices and browsers</CardDescription>
          </CardHeader>
          <CardContent className="p-6 rounded-b-xl bg-muted/40">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.deviceStats}
                    dataKey="count"
                    nameKey="device_type"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} (${safeToFixed(percent * 100, 0)}%)`}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {data.deviceStats?.map((entry, index) => (
                      <Cell key={`cell-${entry.device_type}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: 8, background: '#fff', boxShadow: '0 2px 8px #0001' }}
                    formatter={(value: number) => formatNumber(value)}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-2">
              {data.deviceStats?.length ? data.deviceStats.map((d) => (
                <div key={d.device_type + d.browser_name} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{d.device_type}</Badge>
                  <span className="text-muted-foreground">{d.browser_name}</span>
                  <span className="ml-auto font-medium">{formatPercent(d.percentage)}</span>
                </div>
              )) : <div className="text-muted-foreground text-sm">No device data.</div>}
            </div>
          </CardContent>
        </Card>

        {/* Location Stats */}
        <Card className="shadow-md rounded-xl">
          <CardHeader className="p-6 rounded-t-xl">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">Top Locations</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Visitor distribution by location.</TooltipContent>
              </Tooltip>
            </div>
            <CardDescription>Visitor distribution by location</CardDescription>
          </CardHeader>
          <CardContent className="p-6 rounded-b-xl">
            <div className="space-y-4">
              {data.locationStats?.length ? data.locationStats.map((location) => (
                <div key={`${location.country}-${location.region}`} className="flex items-center justify-between border-b last:border-b-0 pb-2 last:pb-0">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {location.region}, {location.country}
                    </span>
                  </div>
                  <div className="text-sm font-medium">
                    {formatNumber(location.count)} ({formatPercent(location.percentage)})
                  </div>
                </div>
              )) : <div className="text-muted-foreground text-sm">No location data.</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 