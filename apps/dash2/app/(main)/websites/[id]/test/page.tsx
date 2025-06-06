"use client";

import { useState, use } from "react";
import { 
  useAvailableParameters,
  useBatchDynamicQuery,
  type DynamicQueryRequest
} from "@/hooks/use-dynamic-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SettingsIcon, ZapIcon } from "lucide-react";
import { MinimalTable } from "./components/minimal-table";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

type WebsitePlaceholder = {
  id: string;
  name: string;
  domain: string;
};

interface TestPageParams {
  id: string;
}

// Default date range for testing
const getDefaultDateRange = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  return {
    start_date: thirtyDaysAgo.toISOString().split("T")[0],
    end_date: today.toISOString().split("T")[0],
    granularity: 'daily' as 'hourly' | 'daily',
  };
};

// Generic column helper
const columnHelper = createColumnHelper<any>();

// Reusable column templates
const COLUMN_TEMPLATES = {
  name: (header = 'Name') => columnHelper.accessor('name', {
    header,
    cell: info => <span className="font-medium">{info.getValue()}</span>,
  }),
  visitors: () => columnHelper.accessor('visitors', {
    header: 'Visitors',
    cell: info => <span className="text-muted-foreground">{info.getValue()?.toLocaleString()}</span>,
  }),
  pageviews: () => columnHelper.accessor('pageviews', {
    header: 'Pageviews',
    cell: info => <span className="text-muted-foreground">{info.getValue()?.toLocaleString()}</span>,
  }),
  path: () => columnHelper.accessor('name', {
    header: 'Page Path',
    cell: info => <span className="font-medium font-mono text-xs">{info.getValue()}</span>,
  }),
  exits: () => columnHelper.accessor('exits', {
    header: 'Exits',
    cell: info => <span className="text-muted-foreground">{info.getValue()?.toLocaleString() || 'N/A'}</span>,
  }),
  sessions: () => columnHelper.accessor('sessions', {
    header: 'Sessions',
    cell: info => <span className="text-muted-foreground">{info.getValue()?.toLocaleString() || 'N/A'}</span>,
  }),
  loadTime: () => columnHelper.accessor('avg_load_time', {
    header: 'Avg Load Time (ms)',
    cell: info => <span className="text-muted-foreground">{info.getValue()?.toFixed(2) || 'N/A'}</span>,
  }),
};

// Tab configurations - easy to add new tabs
const TAB_CONFIGS = [
  {
    id: 'devices',
    label: 'Devices',
    queries: ['device_type', 'browser_name', 'os_name'],
    columns: [COLUMN_TEMPLATES.name(), COLUMN_TEMPLATES.visitors(), COLUMN_TEMPLATES.pageviews()],
  },
  {
    id: 'geography',
    label: 'Geography', 
    queries: ['country', 'city'],
    columns: [COLUMN_TEMPLATES.name('Location'), COLUMN_TEMPLATES.visitors(), COLUMN_TEMPLATES.pageviews()],
  },
  {
    id: 'utm',
    label: 'UTM Tracking',
    queries: ['utm_source', 'utm_medium', 'utm_campaign'],
    columns: [COLUMN_TEMPLATES.name(), COLUMN_TEMPLATES.visitors(), COLUMN_TEMPLATES.pageviews()],
  },
  {
    id: 'pages',
    label: 'Page Analytics',
    queries: ['top_pages', 'exit_page'],
    columns: [COLUMN_TEMPLATES.path(), COLUMN_TEMPLATES.pageviews(), COLUMN_TEMPLATES.visitors(), COLUMN_TEMPLATES.exits(), COLUMN_TEMPLATES.sessions()],
  },
  {
    id: 'performance',
    label: 'Performance',
    queries: ['slow_pages'],
    columns: [COLUMN_TEMPLATES.path(), COLUMN_TEMPLATES.loadTime(), COLUMN_TEMPLATES.pageviews()],
  },
  {
    id: 'traffic',
    label: 'Traffic Sources',
    queries: ['referrer'],
    columns: [COLUMN_TEMPLATES.name('Referrer'), COLUMN_TEMPLATES.visitors(), COLUMN_TEMPLATES.pageviews()],
  },
];

function AvailableParametersExample({ websiteId }: { websiteId: string }) {
  const { data: params, isLoading } = useAvailableParameters(websiteId);

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <SettingsIcon className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold">Available Parameters</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                All queryable parameters in the system
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted/20 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <SettingsIcon className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base font-semibold">Available Parameters</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              All queryable parameters in the system
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {params && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Parameters</span>
              <Badge variant="outline">{params.parameters.length}</Badge>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {params.parameters.slice(0, 15).map((param: string) => (
                <Badge key={param} variant="secondary" className="text-xs">
                  {param}
                </Badge>
              ))}
              {params.parameters.length > 15 && (
                <Badge variant="outline" className="text-xs">
                  +{params.parameters.length - 15} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnalyticsTable({ websiteId, dateRange }: { websiteId: string, dateRange: any }) {
  // Generate batch queries from tab configs
  const batchQueries = TAB_CONFIGS.map(tab => ({
    id: tab.id,
    parameters: tab.queries,
    limit: 50,
  }));

  const { results, isLoading, meta } = useBatchDynamicQuery(websiteId, dateRange, batchQueries);

  // Convert results to tabs format
  const tabs = TAB_CONFIGS.map(config => {
    const result = results.find(r => r.queryId === config.id);
    return {
      id: config.id,
      label: config.label,
      data: result ? Object.values(result.data).flat() : [],
      columns: config.columns,
    };
  });

  return (
    <div className="space-y-4">
      {/* Batch Query Metrics */}
      {meta && (
        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <ZapIcon className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base font-semibold">Batch Query Performance</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {TAB_CONFIGS.length} analytics categories in a single request
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-lg font-bold text-emerald-600">{meta.total_queries}</div>
                <div className="text-xs text-muted-foreground font-medium">Total Queries</div>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{meta.successful_queries}</div>
                <div className="text-xs text-muted-foreground font-medium">Successful</div>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-lg font-bold text-red-600">{meta.failed_queries}</div>
                <div className="text-xs text-muted-foreground font-medium">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Table */}
      <MinimalTable
        tabs={tabs}
        title="Analytics Dashboard"
        description="Comprehensive analytics data across all categories"
        isLoading={isLoading}
        initialPageSize={10}
        showSearch={true}
        emptyMessage="No analytics data available"
      />
    </div>
  );
}

export default function TestComponentsPage({ params: paramsPromise }: { params: Promise<TestPageParams> }) {
  const params = use(paramsPromise);
  const websiteId = params.id;
  const [dateRange] = useState(() => getDefaultDateRange());

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      {/* Parameters Overview */}
      <AvailableParametersExample websiteId={websiteId} />
      
      {/* Analytics Dashboard */}
      <AnalyticsTable websiteId={websiteId} dateRange={dateRange} />
    </div>
  );
}