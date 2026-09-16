import { io, type Socket } from 'socket.io-client';

import { tokenStorage } from '@/utils/storage';

export const SOCKET_EVENT = {
  WORKSPACE_JOIN: 'workspace:join',
  WORKSPACE_LEAVE: 'workspace:leave',
  CHANNEL_JOIN: 'channel:join',
  CHANNEL_LEAVE: 'channel:leave',
  BOARD_JOIN: 'board:join',
  BOARD_LEAVE: 'board:leave',
  MESSAGE_CREATED: 'message:created',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  REACTION_UPDATED: 'reaction:updated',
  CARD_CREATED: 'card:created',
  CARD_UPDATED: 'card:updated',
  CARD_MOVED: 'card:moved',
  CARD_ARCHIVED: 'card:archived',
  PAGE_UPDATED: 'page:updated',
  NOTIFICATION_CREATED: 'notification:created'
} as const;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: '/realtime',
      transports: ['websocket'],
      autoConnect: false,
      auth: (send) => send({ token: tokenStorage.getAccessToken() })
    });
  }

  return socket;
}

export function connectSocket(): void {
  const instance = getSocket();

  if (!instance.connected) {
    instance.connect();
  }
}

export function disconnectSocket(): void {
  socket?.disconnect();
}
