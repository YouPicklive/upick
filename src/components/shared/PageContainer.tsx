import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Max width class, default max-w-lg */
  maxWidth?: string;
}

/** Standardized page layout wrapper with safe-area insets */
export function PageContainer({ children, className, maxWidth = 'max-w-lg' }: PageContainerProps) {
  return (
    <main className={cn(maxWidth, 'mx-auto px-4 py-6 pb-safe', className)}>
      {children}
    </main>
  );
}
