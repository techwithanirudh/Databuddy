import { getAnalyticsOverviewData } from "./actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Users2,
  Globe2,
  Network,
  ShieldCheck,
  BarChart3,
  Activity
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import LineChart from "@/components/ui/line-chart";
import BarChart from "@/components/ui/bar-chart";

function formatNumber(val: number | null | undefined) {
  return typeof val === 'number' && !Number.isNaN(val) ? val.toLocaleString() : '0';
}

export default async function AdminAnalyticsOverviewPage() {
  const { data, error } = await getAnalyticsOverviewData();

  if (error || !data) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-destructive" />
            Error Loading Analytics
          </CardTitle>
          <CardDescription>
            There was an issue fetching the analytics overview data. Please try again later.
          </CardDescription>
        </CardHeader>
        {error && (
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <Card className="bg-gradient-to-br from-primary/5 to-muted/0 border-0 shadow-none">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 pb-2">
          <div className="flex items-center gap-4">
            <BarChart3 className="h-10 w-10 text-primary bg-primary/10 rounded-full p-2 shadow" />
            <div>
              <CardTitle className="text-3xl font-bold mb-1">Analytics Overview</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Platform-wide metrics and trends for Databuddy.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="group transition-shadow hover:shadow-lg border-0 bg-gradient-to-br from-primary/10 to-primary/0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <span className="bg-primary/20 rounded-full p-2"><Users2 className="h-6 w-6 text-primary" /></span>
              <CardTitle className="text-base font-semibold">Total Users</CardTitle>
              <Tooltip><TooltipTrigger asChild><span className="cursor-pointer" aria-label="Info">ℹ️</span></TooltipTrigger><TooltipContent>Total number of registered users.</TooltipContent></Tooltip>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <div className="text-4xl font-bold text-primary group-hover:scale-105 transition-transform">{formatNumber(data.totalUsers)}</div>
          </CardContent>
        </Card>
        <Card className="group transition-shadow hover:shadow-lg border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <span className="bg-blue-500/20 rounded-full p-2"><Globe2 className="h-6 w-6 text-blue-600" /></span>
              <CardTitle className="text-base font-semibold">Total Websites</CardTitle>
              <Tooltip><TooltipTrigger asChild><span className="cursor-pointer" aria-label="Info">ℹ️</span></TooltipTrigger><TooltipContent>Total number of tracked websites.</TooltipContent></Tooltip>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <div className="text-4xl font-bold text-blue-700 group-hover:scale-105 transition-transform">{formatNumber(data.totalWebsites)}</div>
          </CardContent>
        </Card>
        <Card className="group transition-shadow hover:shadow-lg border-0 bg-gradient-to-br from-purple-500/10 to-purple-500/0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <span className="bg-purple-500/20 rounded-full p-2"><Network className="h-6 w-6 text-purple-600" /></span>
              <CardTitle className="text-base font-semibold">Total Domains</CardTitle>
              <Tooltip><TooltipTrigger asChild><span className="cursor-pointer" aria-label="Info">ℹ️</span></TooltipTrigger><TooltipContent>Total number of domains in the platform.</TooltipContent></Tooltip>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <div className="text-4xl font-bold text-purple-700 group-hover:scale-105 transition-transform">{formatNumber(data.totalDomains)}</div>
          </CardContent>
        </Card>
        <Card className="group transition-shadow hover:shadow-lg border-0 bg-gradient-to-br from-green-500/10 to-green-500/0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <span className="bg-green-500/20 rounded-full p-2"><ShieldCheck className="h-6 w-6 text-green-600" /></span>
              <CardTitle className="text-base font-semibold">Verified Domains</CardTitle>
              <Tooltip><TooltipTrigger asChild><span className="cursor-pointer" aria-label="Info">ℹ️</span></TooltipTrigger><TooltipContent>Domains that have been verified.</TooltipContent></Tooltip>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <div className="text-4xl font-bold text-green-700 group-hover:scale-105 transition-transform">{formatNumber(data.verifiedDomains)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.totalDomains > 0 ? ((data.verifiedDomains / data.totalDomains) * 100).toFixed(1) : '0.0'}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="flex items-center gap-3 mt-8 mb-2">
        <Activity className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">Platform Activity</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-md border-0 bg-gradient-to-br from-primary/5 to-muted/0">
          <CardHeader>
            <CardTitle>Events Over Time</CardTitle>
            <CardDescription>Events tracked in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {data.eventsOverTime && data.eventsOverTime.length > 0 ? (
              <LineChart data={data.eventsOverTime} />
            ) : (
              <div className="text-muted-foreground text-center py-8">No event data available.</div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-md border-0 bg-gradient-to-br from-blue-500/5 to-muted/0">
          <CardHeader>
            <CardTitle>Top Websites by Events</CardTitle>
            <CardDescription>Most active websites in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topWebsites && data.topWebsites.length > 0 ? (
              <BarChart data={data.topWebsites} />
            ) : (
              <div className="text-muted-foreground text-center py-8">No website data available.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 