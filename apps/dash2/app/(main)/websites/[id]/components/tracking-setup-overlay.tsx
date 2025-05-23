"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Code, 
  Zap, 
  ArrowRight, 
  Copy, 
  Check, 
  AlertCircle,
  BarChart,
  TrendingUp,
  Users,
  Globe,
  X
} from "lucide-react";
import { toast } from "sonner";

interface TrackingSetupOverlayProps {
  websiteId: string;
  websiteData: {
    name: string;
    domain: string;
  };
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function TrackingSetupOverlay({ 
  websiteId, 
  websiteData, 
  onClose,
  showCloseButton = true 
}: TrackingSetupOverlayProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  // Generate quick setup script
  const quickSetupScript = `<script
  src="https://app.databuddy.cc/databuddy.js"
  data-client-id="${websiteId}"
  data-api-url="https://basket.databuddy.cc"
  defer
></script>`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(quickSetupScript);
    setCopied(true);
    toast.success("Tracking code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoToSettings = () => {
    router.push(`/websites/${websiteId}?tab=settings`);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto shadow-lg border-2">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Set Up Analytics Tracking</CardTitle>
                <CardDescription className="mt-1">
                  Start collecting data for <span className="font-medium">{websiteData.name}</span>
                </CardDescription>
              </div>
            </div>
            {showCloseButton && onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm text-amber-700 dark:text-amber-300">
              No tracking data detected. Add the tracking code to start collecting analytics.
            </span>
          </div>

          {/* What you'll get */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-sm font-medium">Visitor Analytics</div>
              <div className="text-xs text-muted-foreground mt-1">Track unique visitors and sessions</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-sm font-medium">Performance Metrics</div>
              <div className="text-xs text-muted-foreground mt-1">Page load times and web vitals</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Globe className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="text-sm font-medium">Traffic Sources</div>
              <div className="text-xs text-muted-foreground mt-1">Referrers and user locations</div>
            </div>
          </div>

          <Separator />

          {/* Quick setup */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Quick Setup</h3>
              <Badge variant="secondary" className="text-xs">Recommended</Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Add this script to the <code className="bg-muted px-1 py-0.5 rounded text-xs">&lt;head&gt;</code> section of your website:
            </p>
            
            <div className="relative">
              <div className="bg-secondary/50 dark:bg-secondary/20 rounded-md p-3 overflow-x-auto border">
                <pre className="text-xs font-mono leading-relaxed">
                  <code>{quickSetupScript}</code>
                </pre>
              </div>
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={handleCopyScript}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleGoToSettings} className="flex-1 gap-2">
              <Code className="h-4 w-4" />
              View Full Setup Guide
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleCopyScript}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Code
                </>
              )}
            </Button>
          </div>

          {/* Help text */}
          <div className="text-xs text-muted-foreground text-center">
            Need help? Check our{" "}
            <Button variant="link" className="h-auto p-0 text-xs">
              documentation
            </Button>{" "}
            or contact support.
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 