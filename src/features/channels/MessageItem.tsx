import { memo } from 'react';
import type { IconType } from 'react-icons';
import { FiAward, FiEye, FiHeart, FiHelpCircle, FiThumbsUp, FiTrash2, FiZap } from 'react-icons/fi';

import IconButton from '@/components/ui/IconButton';
import { Avatar } from '@/components/ui/Display';
import { cn } from '@/utils/cn';
import { formatTime, personId } from '@/utils/format';
import { isMentionWord } from '@/utils/mentions';
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

function MessageBody({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((word, index) => (
        <span key={index}>
          {index > 0 && ' '}
          {isMentionWord(word) ? <strong className="font-semibold">{word}</strong> : word}
        </span>
      ))}
    </>
  );
}

function MessageItem({ message, currentUserId, canWrite, grouped, onReact, onDelete }: MessageItemProps) {
  const mine = personId(message.author) === currentUserId;
  const interactive = canWrite && !message.pending;

  return (
    <li className={cn('group relative flex gap-2 px-4', mine ? 'flex-row-reverse' : 'flex-row', grouped ? 'mt-1' : 'mt-4')}>
      {!mine && <div className="w-8 shrink-0">{!grouped && <Avatar name={message.author.name} />}</div>}

      <div className={cn('flex max-w-[78%] min-w-0 flex-col sm:max-w-[65%]', mine ? 'items-end' : 'items-start')}>
        {!grouped && (
          <p className="mb-1 px-1 text-xs text-stone-500">
            {!mine && <span className="mr-1.5 font-medium text-stone-700 dark:text-stone-300">{message.author.name}</span>}
            {formatTime(message.createdAt)}
          </p>
        )}

        <div
          className={cn(
            'rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap',
            mine
              ? 'rounded-br-md bg-brand-700 text-white'
              : 'rounded-bl-md bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-100',
            message.pending && 'opacity-60'
          )}
        >
          <MessageBody text={message.body} />
        </div>

        {(message.editedAt || message.pending) && (
          <span className="mt-0.5 px-1 text-[11px] text-stone-400">{message.pending ? 'sending…' : 'edited'}</span>
        )}

        {message.reactions.length > 0 && (
          <div className={cn('mt-1 flex flex-wrap gap-1', mine && 'justify-end')}>
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
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs',
                    reacted
                      ? 'border-brand-600 bg-brand-50 text-brand-800 dark:bg-brand-800/30 dark:text-brand-100'
                      : 'border-stone-200 bg-white text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300'
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
        <div
          className={cn(
            'absolute -top-4 z-10 hidden items-center rounded-md border border-stone-200 bg-white group-hover:flex dark:border-stone-700 dark:bg-stone-900',
            mine ? 'left-4' : 'right-4'
          )}
        >
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
