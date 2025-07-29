'use client';

import { useEffect, useMemo, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { RoomAudioRenderer, RoomContext, StartAudio } from '@livekit/components-react';
import { Welcome } from '@/components/main/welcome';


export function Session() {
    const room = useMemo(() => new Room(), []);
    const [sessionStarted, setSessionStarted] = useState(false);
    const [participantToken, setParticipantToken] = useState(null);

    const serverUrl="wss://parrot-8ggzczwu.livekit.cloud"
    useEffect(() => {
        fetch(`http://127.0.0.1:5000/getToken`)
            .then(res => res.json())
            .then(data => {
                console.log("Token received:", data.token);
                setParticipantToken(data.token);
            })
            .catch(error => {
                console.error("Error fetching token:", error);
            });
    }, []);

    useEffect(() => {
    let aborted = false;
    if (sessionStarted && room.state === 'disconnected' && participantToken) {
      Promise.all([
        room.localParticipant.setMicrophoneEnabled(true, undefined, {
          preConnectBuffer: true,
        }),
        room.connect(serverUrl, participantToken),
      ]).catch((error) => {
        if (aborted) {
          return;
        }

        toast({
          title: 'There was an error connecting to the agent',
          description: `${error.name}: ${error.message}`,
        });
      });
    }
    return () => {
      aborted = true;
      room.disconnect();
    };
  }, [room, sessionStarted, participantToken]);


    return (
        <RoomContext.Provider value={room}>
            <Welcome 
                startButtonText="Start Interview"
                onStartCall={() => setSessionStarted(true)}
            />
            <RoomAudioRenderer />
            <StartAudio />
        </RoomContext.Provider>
    )
}