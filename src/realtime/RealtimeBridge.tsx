import { useEffect } from 'react';

import { SOCKET_EVENT, connectSocket, disconnectSocket, getSocket } from './socket';
import { fetchBoard } from '@/store/slices/boardSlice';
import { fetchPageTree } from '@/store/slices/pageSlice';
import { messageChanged, messageReceived, messageRemoved } from '@/store/slices/channelSlice';
import { notificationReceived } from '@/store/slices/notificationSlice';
import { showToast } from '@/store/slices/uiSlice';
import { useAppDispatch, useAppStore } from '@/store/hooks';
import type { AppNotification, Message } from '@/types/models';

const REFRESH_DELAY_MS = 400;

const BOARD_EVENTS = [
  SOCKET_EVENT.CARD_CREATED,
  SOCKET_EVENT.CARD_UPDATED,
  SOCKET_EVENT.CARD_MOVED,
  SOCKET_EVENT.CARD_ARCHIVED
];

export default function RealtimeBridge() {
  const dispatch = useAppDispatch();
  const store = useAppStore();

  useEffect(() => {
    const socket = getSocket();
    let boardTimer: number | undefined;

    const onMessageCreated = (message: Message) => dispatch(messageReceived(message));
    const onMessageChanged = (message: Message) => dispatch(messageChanged(message));
    const onMessageDeleted = ({ id }: { id: string }) => dispatch(messageRemoved(id));

    const onBoardChanged = () => {
      window.clearTimeout(boardTimer);
      boardTimer = window.setTimeout(() => {
        const { boards, workspaces } = store.getState();

        if (boards.snapshot && workspaces.current) {
          dispatch(fetchBoard({ workspaceId: workspaces.current.id, boardId: boards.snapshot.id }));
        }
      }, REFRESH_DELAY_MS);
    };

    const onPageUpdated = () => {
      const workspace = store.getState().workspaces.current;

      if (workspace) {
        dispatch(fetchPageTree(workspace.id));
      }
    };

    const onNotification = (notification: AppNotification) => {
      dispatch(notificationReceived(notification));
      dispatch(showToast(notification.title, 'info'));
    };

    socket.on(SOCKET_EVENT.MESSAGE_CREATED, onMessageCreated);
    socket.on(SOCKET_EVENT.MESSAGE_UPDATED, onMessageChanged);
    socket.on(SOCKET_EVENT.REACTION_UPDATED, onMessageChanged);
    socket.on(SOCKET_EVENT.MESSAGE_DELETED, onMessageDeleted);
    socket.on(SOCKET_EVENT.PAGE_UPDATED, onPageUpdated);
    socket.on(SOCKET_EVENT.NOTIFICATION_CREATED, onNotification);
    BOARD_EVENTS.forEach((event) => socket.on(event, onBoardChanged));

    connectSocket();

    return () => {
      socket.off(SOCKET_EVENT.MESSAGE_CREATED, onMessageCreated);
      socket.off(SOCKET_EVENT.MESSAGE_UPDATED, onMessageChanged);
      socket.off(SOCKET_EVENT.REACTION_UPDATED, onMessageChanged);
      socket.off(SOCKET_EVENT.MESSAGE_DELETED, onMessageDeleted);
      socket.off(SOCKET_EVENT.PAGE_UPDATED, onPageUpdated);
      socket.off(SOCKET_EVENT.NOTIFICATION_CREATED, onNotification);
      BOARD_EVENTS.forEach((event) => socket.off(event, onBoardChanged));
      window.clearTimeout(boardTimer);
      disconnectSocket();
    };
  }, [dispatch, store]);

  return null;
}
