"use client";

import { ChatHistory } from "./history";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { PlusIcon, ArrowLeftIcon } from "@phosphor-icons/react";

export function ChatHeader({ websiteId }: { websiteId: string }) {
  const router = useRouter();

  const handleNewChat = () => {
    router.push(`/websites/${websiteId}/assistant`);
  };

  return (
    <div className="relative z-10 bg-background py-6 flex justify-between w-full px-6 border-b border-border">
      <div className="flex items-center">
        <Button variant="outline" size="icon" onClick={() => router.push("/")}>
          <ArrowLeftIcon size={16} />
        </Button>
      </div>

      <div
        className={cn(
          "flex items-center justify-center transition-all duration-300 ease-in-out",
        )}
      >
        {/* {data && (
          <TextEffect
            per="char"
            preset="fade"
            speedReveal={3}
            speedSegment={2}
            className="text-sm font-regular truncate"
          >
            {data.title}
          </TextEffect>
        )} */}
      </div>

      <div className="flex items-center space-x-4 transition-all duration-300 ease-in-out">
        <Button variant="outline" size="icon" onClick={handleNewChat}>
            <PlusIcon size={16} />
        </Button>
        <ChatHistory websiteId={websiteId} />
      </div>
    </div>
  );
}