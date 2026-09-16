import { useCallback, useEffect } from 'react';
import { FiHash, FiLock } from 'react-icons/fi';

import Button from '@/components/ui/Button';
import Composer from './Composer';
import MessageList from './MessageList';
import useNotify from '@/hooks/useNotify';
import useRealtimeRoom from '@/realtime/useRealtimeRoom';
import { SOCKET_EVENT } from '@/realtime/socket';
import { channelApi } from '@/api/services';
import {
  deleteMessage,
  fetchMessages,
  joinChannel,
  leaveChannel,
  newTempId,
  openChannel,
  sendMessage,
  toggleReaction
} from '@/store/slices/channelSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { Channel, Message, Reaction } from '@/types/models';

interface ChannelViewProps {
  channel: Channel;
  workspaceId: string;
  canWrite: boolean;
}

export default function ChannelView({ channel, workspaceId, canWrite }: ChannelViewProps) {
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const user = useAppSelector((state) => state.auth.user)!;
  const { messages, hasMore, cursor, loadingMessages } = useAppSelector((state) => state.channels);

  const ref = { workspaceId, channelId: channel.id };
  const canPost = canWrite && channel.joined;

  useRealtimeRoom(SOCKET_EVENT.CHANNEL_JOIN, SOCKET_EVENT.CHANNEL_LEAVE, channel.id, ref);

  useEffect(() => {
    dispatch(openChannel(channel.id));
    dispatch(fetchMessages({ workspaceId, channelId: channel.id }));

    if (channel.joined) {
      channelApi.markRead(workspaceId, channel.id).catch(() => undefined);
    }
  }, [dispatch, workspaceId, channel.id, channel.joined]);

  const loadOlder = useCallback(() => {
    if (cursor) {
      dispatch(fetchMessages({ workspaceId, channelId: channel.id, before: cursor }));
    }
  }, [dispatch, workspaceId, channel.id, cursor]);

  const send = useCallback(
    (body: string) => {
      dispatch(
        sendMessage({
          workspaceId,
          channelId: channel.id,
          body,
          tempId: newTempId(),
          author: { id: user.id, name: user.name, email: user.email }
        })
      )
        .unwrap()
        .catch((error) => notify.error(error));
    },
    [dispatch, notify, workspaceId, channel.id, user]
  );

  const react = useCallback(
    (message: Message, emoji: Reaction) => {
      dispatch(toggleReaction({ workspaceId, channelId: channel.id, messageId: message.id, emoji, userId: user.id }))
        .unwrap()
        .catch((error) => notify.error(error));
    },
    [dispatch, notify, workspaceId, channel.id, user.id]
  );

  const remove = useCallback(
    (message: Message) => {
      dispatch(deleteMessage({ workspaceId, channelId: channel.id, messageId: message.id }))
        .unwrap()
        .catch((error) => notify.error(error));
    },
    [dispatch, notify, workspaceId, channel.id]
  );

  const toggleMembership = async () => {
    try {
      if (channel.joined) {
        await dispatch(leaveChannel(ref)).unwrap();
      } else {
        await dispatch(joinChannel(ref)).unwrap();
      }
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-stone-200 px-4 py-3 dark:border-stone-800">
        {channel.visibility === 'private' ? <FiLock className="text-stone-500" /> : <FiHash className="text-stone-500" />}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold">{channel.name}</h1>
          {channel.topic && <p className="truncate text-xs text-stone-500">{channel.topic}</p>}
        </div>
        <span className="hidden text-xs text-stone-500 sm:inline">{channel.memberCount} members</span>
        {canWrite && (
          <Button size="sm" variant={channel.joined ? 'secondary' : 'primary'} onClick={toggleMembership}>
            {channel.joined ? 'Leave' : 'Join'}
          </Button>
        )}
      </header>

      <MessageList
        messages={messages}
        hasMore={hasMore}
        loading={loadingMessages}
        currentUserId={user.id}
        canWrite={canPost}
        onLoadOlder={loadOlder}
        onReact={react}
        onDelete={remove}
      />

      <Composer channelName={channel.name} disabled={!canPost} onSend={send} />
    </div>
  );
}
