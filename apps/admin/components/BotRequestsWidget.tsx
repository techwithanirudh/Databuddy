"use client";
import { useEffect, useState } from "react";

export default function BotRequestsWidget() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const eventSource = new EventSource("/api/bot-requests/stream");
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setCount(data.botRequests);
      } catch (e) {
        // ignore
      }
    };
    eventSource.onerror = () => {
      eventSource.close();
    };
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="mb-4 p-4 rounded bg-muted text-foreground shadow">
      <span className="font-semibold">Bot Requests:</span> {count === null ? "0" : count}
    </div>
  );
} 