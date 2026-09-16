import { memo } from 'react';
import type { IconType } from 'react-icons';
import { FiAward, FiEye, FiHeart, FiHelpCircle, FiThumbsUp, FiTrash2, FiZap } from 'react-icons/fi';

import IconButton from '@/components/ui/IconButton';
import { Avatar } from '@/components/ui/Display';
import { cn } from '@/utils/cn';
import { formatTime, personId } from '@/utils/format';
import type { Message, Reaction } from '@/types/models';

export const REACTIONS: { key: Reaction; label: string; icon: IconType }[] = [
  { key: 'like', label: 'Like', icon: FiThumbsUp },
  { key: 'thanks', label: 'Thanks', icon: FiHeart },
  { key: 'celebrate', label: 'Celebrate', icon: FiAward },
  { key: 'fire', label: 'On fire', icon: FiZap },
  { key: 'eyes', label: 'Looking', icon: FiEye },
  { key: 'question', label: 'Question', icon: FiHelpCircle }
];

interface MessageItemProps {
  message: Message;
  currentUserId: string;
  canWrite: boolean;
  grouped: boolean;
  onReact: (message: Message, emoji: Reaction) => void;
  onDelete: (message: Message) => void;
}

function MessageItem({ message, currentUserId, canWrite, grouped, onReact, onDelete }: MessageItemProps) {
  const mine = personId(message.author) === currentUserId;
  const interactive = canWrite && !message.pending;

  return (
    <li className={cn('group relative flex gap-3 px-4 hover:bg-stone-100/70 dark:hover:bg-stone-900', grouped ? 'py-0.5' : 'pt-3 pb-0.5')}>
      <div className="w-8 shrink-0">{!grouped && <Avatar name={message.author.name} />}</div>
      <div className="min-w-0 flex-1">
        {!grouped && (
          <p className="text-sm">
            <span className="font-semibold">{message.author.name}</span>{' '}
            <span className="text-xs text-stone-500">{formatTime(message.createdAt)}</span>
          </p>
        )}
        <p className={cn('text-sm break-words whitespace-pre-wrap', message.pending && 'text-stone-400')}>
          {message.body}
          {message.editedAt && <span className="ml-1 text-xs text-stone-400">(edited)</span>}
          {message.pending && <span className="ml-1 text-xs text-stone-400">sending…</span>}
        </p>

        {message.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {message.reactions.map((reaction) => {
              const meta = REACTIONS.find((item) => item.key === reaction.emoji);
              const Icon = meta?.icon ?? FiThumbsUp;
              const reacted = reaction.users.includes(currentUserId);

              return (
                <button
                  key={reaction.emoji}
                  type="button"
                  disabled={!interactive}
                  onClick={() => onReact(message, reaction.emoji)}
                  aria-label={`${meta?.label ?? reaction.emoji}, ${reaction.users.length}`}
                  className={cn(
                    'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs',
                    reacted
                      ? 'border-brand-600 bg-brand-50 text-brand-800 dark:bg-brand-800/30 dark:text-brand-100'
                      : 'border-stone-200 text-stone-600 dark:border-stone-700 dark:text-stone-300'
                  )}
                >
                  <Icon /> {reaction.users.length}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {interactive && (
        <div className="absolute -top-3 right-4 hidden items-center rounded-md border border-stone-200 bg-white group-hover:flex dark:border-stone-700 dark:bg-stone-900">
          {REACTIONS.map(({ key, label, icon: Icon }) => (
            <IconButton key={key} label={label} icon={<Icon />} onClick={() => onReact(message, key)} />
          ))}
          {mine && <IconButton label="Delete message" icon={<FiTrash2 />} onClick={() => onDelete(message)} />}
        </div>
      )}
    </li>
  );
}

export default memo(MessageItem);
