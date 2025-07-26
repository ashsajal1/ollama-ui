'use client'

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <h2 className="text-2xl font-bold">Chat Not Found</h2>
      <p className="text-muted-foreground">
        The chat you&apos;re looking for doesn&apos;t exist or has been deleted.
      </p>
      <div className="flex space-x-4">
        <Button onClick={() => router.push('/')}>
          Go to Home
        </Button>
        <Button variant="outline" onClick={reset}>
          Try Again
        </Button>
      </div>
    </div>
  );
} 