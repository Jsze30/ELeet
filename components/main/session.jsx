'use client';

import { useEffect, useMemo, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { RoomAudioRenderer, RoomContext, StartAudio } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { Welcome } from '@/components/main/welcome_page';
import { Interview } from '@/components/main/interview_page';


export function Session() {
    const room = useMemo(() => new Room(), []);
    const [sessionStarted, setSessionStarted] = useState(false);
    const [participantToken, setParticipantToken] = useState(null);
    const [currentStage, setCurrentStage] = useState('welcome'); 
    const [timeLimit, setTimeLimit] = useState(1800);

    const serverUrl="wss://parrot-8ggzczwu.livekit.cloud"
    
    const goToStage = (stage, time) => {
        setCurrentStage(stage);
        if (stage === 'interview') {
            setSessionStarted(true);
            setTimeLimit(time);
        }
        else if (stage === 'welcome' || stage === 'summary') {
            setSessionStarted(false);
        }
    };

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

    const StageManager = () => {
        switch (currentStage) {
            case 'welcome':
                return (
                    <Welcome onStartInterview={(time) => goToStage('interview', time)}/>
                );
            case 'interview':
                return (
                    <Interview 
                      timeLimit={timeLimit}
                      onEndInterview={() => goToStage('summary')}
                    />
                );
            case 'summary':
                return (
                    <div className="summary-container">
                        <h2>Interview Summary</h2>
                        <Button onClick={() => goToStage('welcome')}>Start New Interview</Button>
                    </div>
                );
            default:
                return <div>Unknown stage</div>;
        }
    };

    return (
        <RoomContext.Provider value={room}>
            {StageManager()}
            <RoomAudioRenderer />
            <StartAudio />
        </RoomContext.Provider>
    )
}