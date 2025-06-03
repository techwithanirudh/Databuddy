"use client";

import React from "react";
import { Bot, User, BarChart3, LineChart, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "../types/message";

interface MessageBubbleProps {
  message: Message;
}

const getChartIcon = (chartType: string) => {
  switch (chartType) {
    case 'bar': return <BarChart3 className="h-4 w-4" />;
    case 'line': return <LineChart className="h-4 w-4" />;
    case 'pie': return <PieChart className="h-4 w-4" />;
    default: return <BarChart3 className="h-4 w-4" />;
  }
};

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex gap-3 max-w-[85%]",
        message.type === 'user' ? "ml-auto flex-row-reverse" : ""
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
        message.type === 'user' 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted"
      )}>
        {message.type === 'user' ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>
      
      <div className={cn(
        "rounded-lg px-4 py-3 max-w-full",
        message.type === 'user'
          ? "bg-primary text-primary-foreground ml-2"
          : "bg-muted mr-2"
      )}>
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>
        
        {message.hasVisualization && message.type === 'assistant' && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {getChartIcon(message.chartType || 'bar')}
              <span>Visualization available in the data panel →</span>
            </div>
          </div>
        )}
        
        <div className="text-xs opacity-70 mt-2">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
} 