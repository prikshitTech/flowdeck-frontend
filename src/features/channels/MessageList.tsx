import { useCallback, useLayoutEffect, useRef } from 'react';

import MessageItem from './MessageItem';
import Spinner from '@/components/ui/Spinner';
import useInfiniteScroll from '@/hooks/useInfiniteScroll';
import { personId } from '@/utils/format';
import type { Message, Reaction } from '@/types/models';

const GROUP_WINDOW_MS = 5 * 60 * 1000;
const STICK_TO_BOTTOM_PX = 120;

interface MessageListProps {
  messages: Message[];
  hasMore: boolean;
  loading: boolean;
  currentUserId: string;
  canWrite: boolean;
  onLoadOlder: () => void;
  onReact: (message: Message, emoji: Reaction) => void;
  onDelete: (message: Message) => void;
}

function startsGroup(message: Message, previous: Message | undefined): boolean {
  if (!previous || personId(previous.author) !== personId(message.author)) {
    return true;
  }

  return new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() > GROUP_WINDOW_MS;
}

export default function MessageList({
  messages,
  hasMore,
  loading,
  currentUserId,
  canWrite,
  onLoadOlder,
  onReact,
  onDelete
}: MessageListProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const previousHeight = useRef(0);
  const previousFirstId = useRef<string | undefined>(undefined);
  const previousLastId = useRef<string | undefined>(undefined);

  const loadOlder = useCallback(() => {
    previousHeight.current = scroller.current?.scrollHeight ?? 0;
    onLoadOlder();
  }, [onLoadOlder]);

  const topSentinel = useInfiniteScroll({ enabled: hasMore && !loading, onReach: loadOlder, rootMargin: '100px' });

  useLayoutEffect(() => {
    const element = scroller.current;

    if (!element || messages.length === 0) {
      return;
    }

    const firstId = messages[0].id;
    const lastId = messages[messages.length - 1].id;
    const prepended = previousFirstId.current !== undefined && firstId !== previousFirstId.current && lastId === previousLastId.current;

    if (prepended) {
      element.scrollTop += element.scrollHeight - previousHeight.current;
    } else if (lastId !== previousLastId.current) {
      const nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < STICK_TO_BOTTOM_PX;
      const ownMessage = personId(messages[messages.length - 1].author) === currentUserId;

      if (previousLastId.current === undefined || nearBottom || ownMessage) {
        element.scrollTop = element.scrollHeight;
      }
    }

    previousFirstId.current = firstId;
    previousLastId.current = lastId;
  }, [messages, currentUserId]);

  return (
    <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto py-2" aria-live="polite">
      <div ref={topSentinel} className="flex h-8 items-center justify-center">
        {loading && <Spinner size="sm" />}
        {!hasMore && !loading && messages.length > 0 && <span className="text-xs text-stone-400">Start of the channel</span>}
      </div>
      <ul>
        {messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            currentUserId={currentUserId}
            canWrite={canWrite}
            grouped={!startsGroup(message, messages[index - 1])}
            onReact={onReact}
            onDelete={onDelete}
          />
        ))}
      </ul>
      {!loading && messages.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-stone-500">No messages yet. Say hello.</p>
      )}
    </div>
  );
}
