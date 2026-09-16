import { memo, type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/utils/cn';

interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  label: string;
  icon: ReactNode;
  active?: boolean;
}

function IconButton({ label, icon, active = false, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-stone-500',
        'hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100',
        'focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-50',
        active && 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100',
        className
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}

export default memo(IconButton);
