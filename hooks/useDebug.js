import * as React from 'react';
import { setLogLevel } from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';

export const useDebugMode = ({ logLevel } = {}) => {
  const room = useRoomContext();

  React.useEffect(() => {
    setLogLevel(logLevel ?? 'debug');

    window.__lk_room = room;

    return () => {
      window.__lk_room = undefined;
    };
  }, [room, logLevel]);
};
