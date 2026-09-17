import { memo, useMemo, useState, type KeyboardEvent } from 'react';
import { FiSend } from 'react-icons/fi';

import IconButton from '@/components/ui/IconButton';
import { Avatar } from '@/components/ui/Display';
import { currentMentionQuery, insertMention, mentionHandle, type MentionCandidate } from '@/utils/mentions';

interface ComposerProps {
  channelName: string;
  disabled: boolean;
  candidates: MentionCandidate[];
  onSend: (body: string) => void;
}

const MAX_LENGTH = 4000;
const MAX_SUGGESTIONS = 5;

function Composer({ channelName, disabled, candidates, onSend }: ComposerProps) {
  const [draft, setDraft] = useState('');

  const suggestions = useMemo(() => {
    const query = currentMentionQuery(draft);

    if (query === null) {
      return [];
    }

    return candidates
      .filter((candidate) => mentionHandle(candidate.name).toLowerCase().startsWith(query))
      .slice(0, MAX_SUGGESTIONS);
  }, [draft, candidates]);

  const submit = () => {
    const body = draft.trim();

    if (!body || disabled) {
      return;
    }

    onSend(body);
    setDraft('');
  };

  const pick = (candidate: MentionCandidate) => {
    setDraft((current) => insertMention(current, candidate));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Tab' && suggestions.length > 0) {
      event.preventDefault();
      pick(suggestions[0]);
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();

      if (suggestions.length > 0) {
        pick(suggestions[0]);
      } else {
        submit();
      }
    }
  };

  return (
    <div className="relative border-t border-stone-200 p-3 dark:border-stone-800">
      {suggestions.length > 0 && (
        <ul
          role="listbox"
          aria-label="Mention someone"
          className="absolute bottom-full left-3 mb-1 w-64 overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900"
        >
          {suggestions.map((candidate, index) => (
            <li key={candidate.id} role="option" aria-selected={index === 0}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(candidate)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <Avatar name={candidate.name} size="sm" />
                <span className="flex-1 truncate">{candidate.name}</span>
                <span className="text-xs text-stone-400">@{mentionHandle(candidate.name)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 focus-within:border-brand-600 dark:border-stone-700 dark:bg-stone-900">
        <textarea
          aria-label={`Message #${channelName}`}
          rows={1}
          value={draft}
          maxLength={MAX_LENGTH}
          disabled={disabled}
          placeholder={disabled ? 'Join the channel to post' : `Message #${channelName}`}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          className="max-h-40 min-h-6 flex-1 resize-none bg-transparent text-sm outline-none"
        />
        <IconButton label="Send message" icon={<FiSend />} onClick={submit} disabled={disabled || !draft.trim()} />
      </div>
      <p className="mt-1 text-xs text-stone-400">Enter to send, Shift + Enter for a new line, @ to mention someone</p>
    </div>
  );
}

export default memo(Composer);
