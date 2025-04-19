// /home/sajal/Desktop/ollama-ui/src/app/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export default function Loading() {
  return (
    <div className="flex h-screen max-w-full mx-auto overflow-hidden">
      {/* Sidebar Skeleton */}
      <div className="w-72 border-r flex flex-col bg-background h-screen sticky top-0 p-4 space-y-4">
        {/* Sidebar Header Skeleton */}
        <div className="flex items-center justify-between border-b pb-4">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
        {/* New Chat Button Skeleton */}
        <Skeleton className="h-10 w-full" />
        {/* Chat List Skeleton */}
        <div className="flex-1 space-y-3 overflow-hidden pr-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-5/6" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-4/5" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      {/* Main Chat Area Skeleton */}
      <div className="flex-1 flex flex-col min-h-0 relative bg-background">
        {/* Message Area Skeleton */}
        <div className="flex-1 px-4 py-4 space-y-4 overflow-hidden">
          {/* Simulate a few messages */}
          <div className="flex justify-end">
            <Skeleton className="h-16 w-3/4 rounded-lg" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-20 w-2/3 rounded-lg" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-12 w-1/2 rounded-lg" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-24 w-4/5 rounded-lg" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-16 w-3/5 rounded-lg" />
          </div>
        </div>

        {/* Input Area Skeleton */}
        <div className="p-4 border-t bg-background">
          <div className="flex gap-2 items-center">
            <Skeleton className="h-12 flex-1 rounded-md" />{" "}
            {/* Textarea Skeleton */}
            <Skeleton className="h-12 w-12 rounded-md" />{" "}
            {/* Button Skeleton */}
          </div>
        </div>
      </div>
    </div>
  );
}
