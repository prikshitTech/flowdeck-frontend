import { memo } from 'react';

import { cn } from '@/utils/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-9 w-9 border-[3px]'
};

function Spinner({ size = 'md', className, label = 'Loading' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block animate-spin rounded-full border-stone-300 border-t-brand-600 dark:border-stone-700 dark:border-t-brand-500',
        SIZES[size],
        className
      )}
    />
  );
}

export default memo(Spinner);

export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex h-full min-h-40 w-full items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  );
}
