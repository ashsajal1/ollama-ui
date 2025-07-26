import { Skeleton } from "@/components/ui/skeleton";

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
      <div className="flex-1 flex flex-col min-h-0 pb-20 relative bg-background">
        <div className="flex-1 px-4 pb-20 mb-4 space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-3/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-3/4" />
        </div>
      </div>
    </div>
  );
} 