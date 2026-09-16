import { memo, useState, type KeyboardEvent } from 'react';
import { FiSend } from 'react-icons/fi';

import IconButton from '@/components/ui/IconButton';

interface ComposerProps {
  channelName: string;
  disabled: boolean;
  onSend: (body: string) => void;
  onTyping?: () => void;
}

const MAX_LENGTH = 4000;

function Composer({ channelName, disabled, onSend, onTyping }: ComposerProps) {
  const [draft, setDraft] = useState('');

  const submit = () => {
    const body = draft.trim();

    if (!body || disabled) {
      return;
    }

    onSend(body);
    setDraft('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-stone-200 p-3 dark:border-stone-800">
      <div className="flex items-end gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 focus-within:border-brand-600 dark:border-stone-700 dark:bg-stone-900">
        <textarea
          aria-label={`Message #${channelName}`}
          rows={1}
          value={draft}
          maxLength={MAX_LENGTH}
          disabled={disabled}
          placeholder={disabled ? 'Join the channel to post' : `Message #${channelName}`}
          onChange={(event) => {
            setDraft(event.target.value);
            onTyping?.();
          }}
          onKeyDown={onKeyDown}
          className="max-h-40 min-h-6 flex-1 resize-none bg-transparent text-sm outline-none"
        />
        <IconButton label="Send message" icon={<FiSend />} onClick={submit} disabled={disabled || !draft.trim()} />
      </div>
      <p className="mt-1 text-xs text-stone-400">Enter to send, Shift + Enter for a new line</p>
    </div>
  );
}

export default memo(Composer);
