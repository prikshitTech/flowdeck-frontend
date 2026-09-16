import { memo } from 'react';

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold text-stone-900 dark:text-stone-100">
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
        <rect width="32" height="32" rx="6" fill="#0f766e" />
        <rect x="7" y="8" width="5" height="16" rx="1" fill="#fff" />
        <rect x="14" y="8" width="5" height="10" rx="1" fill="#fff" />
        <rect x="21" y="8" width="5" height="13" rx="1" fill="#fff" />
      </svg>
      {!compact && <span>FlowDeck</span>}
    </span>
  );
}

export default memo(Logo);
