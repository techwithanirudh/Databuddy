"use client";

import type React from "react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, MessageSquare } from "lucide-react";
import type { WebsiteDataTabProps } from "../../_components/utils/types";
import { MessageBubble } from "./message-bubble";
import { LoadingMessage } from "./loading-message";
import { useChat } from "../hooks/use-chat";

export default function ChatSection({ websiteData, websiteId }: WebsiteDataTabProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    scrollAreaRef,
    sendMessage,
    handleKeyPress,
  } = useChat(websiteId, websiteData?.name);

  return (
    <Card className="rounded-lg border bg-background shadow-sm flex flex-col h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          AI Analytics Assistant
        </CardTitle>
        <CardDescription>
          Ask questions about your analytics data and get insights
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-6">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {isLoading && <LoadingMessage />}
          </div>
        </ScrollArea>
        
        {/* Input */}
        <div className="p-6 pt-4 border-t">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your analytics data..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>Try asking about trends, comparisons, or specific metrics</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 