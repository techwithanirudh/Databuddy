"use client";

import { useState, useEffect } from "react";

// Temporary analytics data hook
function useAnalyticsData() {
  const [timeSeriesData, setTimeSeriesData] = useState({
    visitors: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: Math.floor(Math.random() * 1000) + 500,
    })),
    pageViews: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: Math.floor(Math.random() * 2000) + 1000,
    })),
    bounceRate: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: Math.floor(Math.random() * 20) + 30,
    })),
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return { timeSeriesData, isLoading };
}

// Temporary analytics summary hook
function useAnalyticsSummary() {
  const [summary, setSummary] = useState({
    totalVisitors: 24583,
    visitorsTrend: "+12%",
    totalPageViews: 68294,
    pageViewsTrend: "+8%",
    averageBounceRate: "42%",
    bounceRateTrend: "-5%"
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    
    return () => clearTimeout(timer);
  }, []);
  
  return { summary, isLoading, error };
}

import { AnalyticsChart } from "./analytics-chart";
import { Card, CardContent } from "@/components/ui/card";
import { Users, MousePointerClick, Activity, ArrowUpRight, Clock } from "lucide-react";
import { Loader2 } from "lucide-react";

export function AnalyticsDashboard() {
  const { timeSeriesData, isLoading } = useAnalyticsData();
  
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <AnalyticsChart 
          title="Visitors" 
          data={timeSeriesData.visitors} 
          color="#38bdf8" 
          type="area"
          isLoading={isLoading}
        />
        <AnalyticsChart 
          title="Page Views" 
          data={timeSeriesData.pageViews} 
          color="#818cf8" 
          type="area"
          isLoading={isLoading}
        />
        <AnalyticsChart 
          title="Bounce Rate" 
          data={timeSeriesData.bounceRate} 
          color="#fbbf24" 
          type="line"
          valueFormatter={(value) => `${value}%`}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export function AnalyticsSummaryCards() {
  const { summary, isLoading, error } = useAnalyticsSummary();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 p-4 rounded-md my-6">
        <h3 className="font-semibold mb-1">Error Loading Analytics</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1 flex items-center">
                <Users className="h-3.5 w-3.5 mr-1" />
                Total Visitors
              </p>
              <p className="text-2xl font-semibold text-white">{summary.totalVisitors.toLocaleString()}</p>
            </div>
            <span className="text-xs text-emerald-400 flex items-center">
              {summary.visitorsTrend}
              <ArrowUpRight className="h-3 w-3 ml-0.5" />
            </span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1 flex items-center">
                <MousePointerClick className="h-3.5 w-3.5 mr-1" />
                Page Views
              </p>
              <p className="text-2xl font-semibold text-white">{summary.totalPageViews.toLocaleString()}</p>
            </div>
            <span className="text-xs text-emerald-400 flex items-center">
              {summary.pageViewsTrend}
              <ArrowUpRight className="h-3 w-3 ml-0.5" />
            </span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1 flex items-center">
                <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                Bounce Rate
              </p>
              <p className="text-2xl font-semibold text-white">{summary.averageBounceRate}</p>
            </div>
            <span className="text-xs text-emerald-400 flex items-center">
              {summary.bounceRateTrend}
              <ArrowUpRight className="h-3 w-3 ml-0.5 rotate-180" />
            </span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1 flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1" />
                Avg. Time
              </p>
              <p className="text-2xl font-semibold text-white">2m 30s</p>
            </div>
            <span className="text-xs text-emerald-400 flex items-center">
              +8%
              <ArrowUpRight className="h-3 w-3 ml-0.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
  color: "sky" | "indigo" | "amber";
}

function StatCard({ label, value, trend, icon, color }: StatCardProps) {
  const colorMap = {
    sky: "bg-sky-500/10 text-sky-400",
    indigo: "bg-indigo-500/10 text-indigo-400",
    amber: "bg-amber-500/10 text-amber-400",
  };
  
  return (
    <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-sm overflow-hidden transition-all hover:shadow-md hover:shadow-sky-500/5 hover:border-sky-500/30">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-white">{value}</p>
              <span className="text-xs font-medium text-emerald-400 flex items-center">
                {trend}
              </span>
            </div>
          </div>
          <div className={`rounded-full p-3 ${colorMap[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 