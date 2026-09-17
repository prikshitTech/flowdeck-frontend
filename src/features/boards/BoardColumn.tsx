import { Draggable, Droppable } from '@hello-pangea/dnd';
import { memo, useState, type FormEvent } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import Button from '@/components/ui/Button';
import CardItem from './CardItem';
import IconButton from '@/components/ui/IconButton';
import { cn } from '@/utils/cn';
import type { BoardColumn as Column, Card } from '@/types/models';

interface BoardColumnProps {
  column: Column;
  canWrite: boolean;
  onOpenCard: (card: Card) => void;
  onAddCard: (listId: string, title: string) => Promise<void>;
  onArchive: (column: Column) => void;
}

function BoardColumn({ column, canWrite, onOpenCard, onAddCard, onArchive }: BoardColumnProps) {
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const full = column.cardLimit !== null && column.cards.length >= column.cardLimit;

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!draft.trim()) {
      return;
    }

    setAdding(true);
    await onAddCard(column.id, draft.trim());
    setDraft('');
    setAdding(false);
  };

  return (
    <section className="flex w-72 shrink-0 flex-col rounded-lg bg-stone-100 dark:bg-stone-900/60">
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        <h2 className="flex-1 truncate text-sm font-semibold">{column.name}</h2>
        <span className={cn('text-xs', full ? 'font-semibold text-amber-700' : 'text-stone-500')}>
          {column.cards.length}
          {column.cardLimit !== null && ` / ${column.cardLimit}`}
        </span>
        {canWrite && <IconButton label={`Archive ${column.name}`} icon={<FiTrash2 />} onClick={() => onArchive(column)} />}
      </header>

      <Droppable droppableId={column.id} isDropDisabled={!canWrite}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex min-h-16 flex-col gap-2 px-2 pb-2',
              snapshot.isDraggingOver && 'bg-brand-50 dark:bg-brand-800/20'
            )}
          >
            {column.cards.map((card, index) => (
              <Draggable key={card.id} draggableId={card.id} index={index} isDragDisabled={!canWrite}>
                {(dragProvided, dragSnapshot) => (
                  <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}>
                    <CardItem card={card} dragging={dragSnapshot.isDragging} onOpen={onOpenCard} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {canWrite && (
        <form onSubmit={submit} className="flex gap-2 border-t border-stone-200 p-2 dark:border-stone-800">
          <input
            aria-label={`New card in ${column.name}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={full ? 'List is full' : 'Add a card'}
            disabled={full}
            maxLength={200}
            className="h-8 min-w-0 flex-1 rounded border border-stone-300 bg-white px-2 text-sm dark:border-stone-700 dark:bg-stone-900"
          />
          <Button type="submit" size="sm" variant="secondary" icon={<FiPlus />} loading={adding} disabled={full || !draft.trim()}>
            <span className="sr-only">Add card</span>
          </Button>
        </form>
      )}
    </section>
  );
}

export default memo(BoardColumn);
