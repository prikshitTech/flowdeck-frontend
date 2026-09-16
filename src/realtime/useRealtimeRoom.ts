import { useEffect, useRef } from 'react';

import { getSocket } from './socket';

export default function useRealtimeRoom(
  joinEvent: string,
  leaveEvent: string,
  roomId: string | undefined,
  joinPayload: unknown
) {
  const payload = useRef(joinPayload);
  payload.current = joinPayload;

  useEffect(() => {
    if (!roomId) {
      return undefined;
    }

    const socket = getSocket();
    const join = () => socket.emit(joinEvent, payload.current);

    join();
    socket.on('connect', join);

    return () => {
      socket.off('connect', join);
      socket.emit(leaveEvent, roomId);
    };
  }, [joinEvent, leaveEvent, roomId]);
}
