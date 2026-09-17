import { createAsyncThunk, createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';

import { channelApi } from '@/api/services';
import type { Channel, ChannelVisibility, Message, Person, Reaction } from '@/types/models';

const PAGE_SIZE = 30;

interface ChannelState {
  channels: Channel[];
  channelsLoading: boolean;
  activeId: string | null;
  messages: Message[];
  hasMore: boolean;
  cursor: string | null;
  loadingMessages: boolean;
  removed: { message: Message; index: number } | null;
}

const initialState: ChannelState = {
  channels: [],
  channelsLoading: false,
  activeId: null,
  messages: [],
  hasMore: false,
  cursor: null,
  loadingMessages: false,
  removed: null
};

interface ChannelRef {
  workspaceId: string;
  channelId: string;
}

export const fetchChannels = createAsyncThunk('channels/fetchAll', async (workspaceId: string) => {
  const { items } = await channelApi.list(workspaceId, { limit: 100 });
  return items;
});

export const createChannel = createAsyncThunk(
  'channels/create',
  ({ workspaceId, ...body }: { workspaceId: string; name: string; topic?: string; visibility: ChannelVisibility }) =>
    channelApi.create(workspaceId, body)
);

export const joinChannel = createAsyncThunk('channels/join', async ({ workspaceId, channelId }: ChannelRef) => {
  await channelApi.join(workspaceId, channelId);
  return channelId;
});

export const leaveChannel = createAsyncThunk('channels/leave', async ({ workspaceId, channelId }: ChannelRef) => {
  await channelApi.leave(workspaceId, channelId);
  return channelId;
});

export const fetchMessages = createAsyncThunk(
  'channels/messages',
  ({ workspaceId, channelId, before }: ChannelRef & { before?: string }) =>
    channelApi.messages(workspaceId, channelId, { limit: PAGE_SIZE, before })
);

export const sendMessage = createAsyncThunk(
  'channels/send',
  ({ workspaceId, channelId, body, mentions }: ChannelRef & { body: string; mentions: string[]; author: Person; tempId: string }) =>
    channelApi.send(workspaceId, channelId, { body, mentions })
);

export const deleteMessage = createAsyncThunk(
  'channels/delete',
  ({ workspaceId, channelId, messageId }: ChannelRef & { messageId: string }) =>
    channelApi.remove(workspaceId, channelId, messageId)
);

export const editMessage = createAsyncThunk(
  'channels/edit',
  ({ workspaceId, channelId, messageId, body }: ChannelRef & { messageId: string; body: string }) =>
    channelApi.edit(workspaceId, channelId, messageId, body)
);

export const toggleReaction = createAsyncThunk(
  'channels/react',
  ({ workspaceId, channelId, messageId, emoji }: ChannelRef & { messageId: string; emoji: Reaction; userId: string }) =>
    channelApi.react(workspaceId, channelId, messageId, emoji)
);

export function newTempId(): string {
  return `temp-${nanoid()}`;
}

function flipReaction(message: Message, emoji: Reaction, userId: string) {
  const existing = message.reactions.find((reaction) => reaction.emoji === emoji);

  if (!existing) {
    message.reactions.push({ emoji, users: [userId] });
  } else if (existing.users.includes(userId)) {
    existing.users = existing.users.filter((id) => id !== userId);
  } else {
    existing.users.push(userId);
  }

  message.reactions = message.reactions.filter((reaction) => reaction.users.length > 0);
}

const channelSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {
    openChannel(state, action: PayloadAction<string | null>) {
      if (state.activeId !== action.payload) {
        state.activeId = action.payload;
        state.messages = [];
        state.hasMore = false;
        state.cursor = null;
      }
    },
    messageReceived(state, action: PayloadAction<Message>) {
      const message = action.payload;

      if (message.channel !== state.activeId || message.parent) {
        return;
      }

      if (!state.messages.some((item) => item.id === message.id)) {
        state.messages.push(message);
      }
    },
    messageChanged(state, action: PayloadAction<Message>) {
      const index = state.messages.findIndex((item) => item.id === action.payload.id);

      if (index >= 0) {
        state.messages[index] = { ...state.messages[index], ...action.payload, author: state.messages[index].author };
      }
    },
    messageRemoved(state, action: PayloadAction<string>) {
      state.messages = state.messages.filter((item) => item.id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChannels.pending, (state) => {
        state.channelsLoading = state.channels.length === 0;
      })
      .addCase(fetchChannels.fulfilled, (state, action) => {
        state.channels = action.payload;
        state.channelsLoading = false;
      })
      .addCase(fetchChannels.rejected, (state) => {
        state.channelsLoading = false;
      })
      .addCase(createChannel.fulfilled, (state, action) => {
        state.channels.unshift({ ...action.payload, joined: true });
      })
      .addCase(joinChannel.fulfilled, (state, action) => {
        const channel = state.channels.find((item) => item.id === action.payload);

        if (channel) {
          channel.joined = true;
          channel.memberCount += 1;
        }
      })
      .addCase(leaveChannel.fulfilled, (state, action) => {
        const channel = state.channels.find((item) => item.id === action.payload);

        if (channel) {
          channel.joined = false;
          channel.memberCount = Math.max(channel.memberCount - 1, 0);
        }
      })
      .addCase(fetchMessages.pending, (state) => {
        state.loadingMessages = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loadingMessages = false;

        if (action.meta.arg.channelId !== state.activeId) {
          return;
        }

        const known = new Set(state.messages.map((item) => item.id));
        const older = action.payload.items.filter((item) => !known.has(item.id));

        state.messages = [...older, ...state.messages];
        state.hasMore = action.payload.meta.hasMore;
        state.cursor = action.payload.meta.next;
      })
      .addCase(fetchMessages.rejected, (state) => {
        state.loadingMessages = false;
      })
      .addCase(sendMessage.pending, (state, action) => {
        const { channelId, body, author, tempId, mentions } = action.meta.arg;

        state.messages.push({
          id: tempId,
          channel: channelId,
          body,
          author,
          parent: null,
          replyCount: 0,
          mentions,
          reactions: [],
          editedAt: null,
          createdAt: new Date().toISOString(),
          pending: true
        });
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const tempIndex = state.messages.findIndex((item) => item.id === action.meta.arg.tempId);
        const alreadyDelivered = state.messages.some((item) => item.id === action.payload.id);

        if (tempIndex < 0) {
          return;
        }

        if (alreadyDelivered) {
          state.messages.splice(tempIndex, 1);
        } else {
          state.messages[tempIndex] = action.payload;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.messages = state.messages.filter((item) => item.id !== action.meta.arg.tempId);
      })
      .addCase(toggleReaction.pending, (state, action) => {
        const message = state.messages.find((item) => item.id === action.meta.arg.messageId);

        if (message) {
          flipReaction(message, action.meta.arg.emoji, action.meta.arg.userId);
        }
      })
      .addCase(toggleReaction.rejected, (state, action) => {
        const message = state.messages.find((item) => item.id === action.meta.arg.messageId);

        if (message) {
          flipReaction(message, action.meta.arg.emoji, action.meta.arg.userId);
        }
      })
      .addCase(deleteMessage.pending, (state, action) => {
        const index = state.messages.findIndex((item) => item.id === action.meta.arg.messageId);

        if (index >= 0) {
          state.removed = { message: state.messages[index], index };
          state.messages.splice(index, 1);
        }
      })
      .addCase(deleteMessage.fulfilled, (state) => {
        state.removed = null;
      })
      .addCase(deleteMessage.rejected, (state) => {
        if (state.removed) {
          state.messages.splice(state.removed.index, 0, state.removed.message);
        }

        state.removed = null;
      })
      .addCase(editMessage.fulfilled, (state, action) => {
        const message = state.messages.find((item) => item.id === action.payload.id);

        if (message) {
          message.body = action.payload.body;
          message.editedAt = action.payload.editedAt;
        }
      });
  }
});

export const { openChannel, messageReceived, messageChanged, messageRemoved } = channelSlice.actions;
export default channelSlice.reducer;
