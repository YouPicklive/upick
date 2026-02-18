import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

/** Full-page centered loading spinner */
export function PageLoader({ message }: PageLoaderProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
