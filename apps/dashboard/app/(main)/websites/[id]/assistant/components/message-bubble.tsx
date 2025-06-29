"use client";

import {
  BarChart3,
  Bot,
  Clock,
  Hash,
  LineChart,
  PieChart,
  User,
} from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import type { Message } from "../types/message";

interface MessageBubbleProps {
  message: Message;
}

const getChartIcon = (chartType: string) => {
  switch (chartType) {
    case "bar":
      return <BarChart3 className="h-4 w-4" />;
    case "line":
      return <LineChart className="h-4 w-4" />;
    case "pie":
      return <PieChart className="h-4 w-4" />;
    default:
      return <BarChart3 className="h-4 w-4" />;
  }
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.type === "user";
  const isInProgress = message.type === "assistant" && !message.content;

  if (isInProgress) {
    return (
      <div className="flex w-full max-w-[85%] gap-3">
        <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border bg-muted shadow-sm">
          <Bot className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 rounded-lg border bg-muted px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex space-x-1">
              <div className="h-2 w-2 animate-bounce rounded-full bg-foreground [animation-delay:-0.3s]" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-foreground [animation-delay:-0.15s]" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-foreground" />
            </div>
            <span className="text-muted-foreground">Nova is analyzing...</span>
          </div>

          {message.thinkingSteps && message.thinkingSteps.length > 0 && (
            <div className="mt-3 border-border/30 border-t pt-3">
              <div className="mt-2 space-y-1">
                {message.thinkingSteps.map((step, index) => (
                  <div
                    className="flex items-start gap-2 py-1 pl-1 text-muted-foreground text-xs"
                    key={`thinking-${index}-${step.slice(0, 20)}`}
                  >
                    <Clock className="mt-0.5 h-3 w-3 flex-shrink-0" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex w-full gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full shadow-sm",
          isUser
            ? "order-2 bg-primary text-primary-foreground"
            : "order-1 border bg-muted"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "relative min-w-0 max-w-[85%] rounded-lg px-4 py-3 shadow-sm",
          isUser
            ? "order-1 bg-primary text-primary-foreground"
            : "order-2 border bg-muted"
        )}
      >
        {/* Main message text */}
        <div className="overflow-wrap-anywhere whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
        </div>

        {/* Metric Display */}
        {message.responseType === "metric" &&
          message.metricValue !== undefined &&
          !isUser && (
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    {message.metricLabel || "Result"}
                  </div>
                  <div className="mt-1 break-words font-bold text-2xl text-foreground">
                    {typeof message.metricValue === "number"
                      ? message.metricValue.toLocaleString()
                      : message.metricValue}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Visualization Indicator */}
        {message.hasVisualization && !isUser && (
          <div className="mt-3 border-border/30 border-t pt-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              {getChartIcon(message.chartType || "bar")}
              <span>Visualization generated in the data panel.</span>
            </div>
          </div>
        )}

        {/* Timestamp (hover) */}
        <div className="absolute -bottom-5 right-0 opacity-0 transition-opacity group-hover:opacity-60">
          <div className="mt-1 font-mono text-xs">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
