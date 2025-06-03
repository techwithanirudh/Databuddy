"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, LineChart, PieChart, TrendingUp } from "lucide-react";
import type { WebsiteDataTabProps } from "../../_components/utils/types";
import { CHART_TYPES, QUICK_INSIGHTS } from "../utils/constants";

interface VisualizationSectionProps extends WebsiteDataTabProps {
  onQuickInsight?: (prompt: string) => void;
}

export default function VisualizationSection({ websiteData, onQuickInsight }: VisualizationSectionProps) {
  return (
    <Card className="rounded-lg border bg-background shadow-sm flex flex-col h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Data Visualization
        </CardTitle>
        <CardDescription>
          Charts and insights generated from your conversations
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {/* Chart Type Selector */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm font-medium">Chart Types:</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <BarChart3 className="h-3 w-3" />
              <span className="text-xs">Bar</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <LineChart className="h-3 w-3" />
              <span className="text-xs">Line</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <PieChart className="h-3 w-3" />
              <span className="text-xs">Pie</span>
            </Button>
          </div>
        </div>
        
        {/* Visualization Area */}
        <div className="flex-1 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
          <div className="text-center space-y-3 max-w-sm">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No visualization yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ask the AI assistant to generate charts from your analytics data
              </p>
            </div>
            <div className="flex flex-wrap gap-1 justify-center">
              <Badge variant="outline" className="text-xs">Traffic Trends</Badge>
              <Badge variant="outline" className="text-xs">Page Performance</Badge>
              <Badge variant="outline" className="text-xs">User Demographics</Badge>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-3">Quick insights:</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_INSIGHTS.slice(0, 4).map((insight) => (
              <Button 
                key={insight.label}
                variant="ghost" 
                size="sm" 
                className="h-8 justify-start text-xs"
                onClick={() => onQuickInsight?.(insight.prompt)}
              >
                {insight.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 