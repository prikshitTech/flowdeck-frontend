import { memo, type KeyboardEvent } from 'react';
import { FiCalendar, FiCheckCircle, FiUsers } from 'react-icons/fi';

import { Badge } from '@/components/ui/Display';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/format';
import type { Card } from '@/types/models';

const PRIORITY_TONE = {
  low: 'neutral',
  normal: 'neutral',
  high: 'warning',
  urgent: 'danger'
} as const;

interface CardItemProps {
  card: Card;
  dragging: boolean;
  onOpen: (card: Card) => void;
}

function CardItem({ card, dragging, onOpen }: CardItemProps) {
  const overdue = !card.completedAt && card.dueAt !== null && new Date(card.dueAt).getTime() < Date.now();

  const openWithKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      onOpen(card);
    }
  };

  return (
    <div
      onClick={() => onOpen(card)}
      onKeyDown={openWithKeyboard}
      className={cn(
        'flex w-full cursor-grab flex-col gap-2 rounded-md border bg-white p-3 text-left text-sm select-none dark:bg-stone-900',
        dragging ? 'cursor-grabbing border-brand-600 shadow-md' : 'border-stone-200 hover:border-stone-400 dark:border-stone-700'
      )}
    >
      <span className={cn('font-medium', card.completedAt && 'text-stone-400 line-through')}>{card.title}</span>
      <span className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
        {card.priority !== 'normal' && <Badge tone={PRIORITY_TONE[card.priority]}>{card.priority}</Badge>}
        {card.labels.map((label) => (
          <Badge key={label}>{label}</Badge>
        ))}
        {card.dueAt && (
          <span className={cn('inline-flex items-center gap-1', overdue && 'font-medium text-red-600')}>
            <FiCalendar /> {formatDate(card.dueAt)}
          </span>
        )}
        {card.assignees.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <FiUsers /> {card.assignees.length}
          </span>
        )}
        {card.completedAt && (
          <span className="inline-flex items-center gap-1 text-green-700">
            <FiCheckCircle /> done
          </span>
        )}
      </span>
    </div>
  );
}

export default memo(CardItem);
