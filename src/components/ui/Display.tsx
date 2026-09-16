import { memo, type ReactNode } from 'react';

import { cn } from '@/utils/cn';

const AVATAR_COLOURS = [
  'bg-teal-100 text-teal-800',
  'bg-amber-100 text-amber-800',
  'bg-sky-100 text-sky-800',
  'bg-rose-100 text-rose-800',
  'bg-lime-100 text-lime-800',
  'bg-violet-100 text-violet-800'
];

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function colourFor(name: string): string {
  const total = [...name].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return AVATAR_COLOURS[total % AVATAR_COLOURS.length];
}

export const Avatar = memo(function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs',
        colourFor(name)
      )}
    >
      {initials(name) || '?'}
    </span>
  );
});

type BadgeTone = 'neutral' | 'brand' | 'warning' | 'danger' | 'success';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
  brand: 'bg-brand-50 text-brand-800 dark:bg-brand-800/30 dark:text-brand-100',
  warning: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  danger: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  success: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
};

export const Badge = memo(function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium', BADGE_TONES[tone])}>
      {children}
    </span>
  );
});

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900',
        className
      )}
    >
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">{title}</h1>
        {description && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <span className="text-3xl text-stone-400">{icon}</span>
      <p className="font-medium text-stone-800 dark:text-stone-200">{title}</p>
      {message && <p className="max-w-sm text-sm text-stone-500 dark:text-stone-400">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Panel className="p-4">
      <p className="text-xs font-medium tracking-wide text-stone-500 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </Panel>
  );
}
