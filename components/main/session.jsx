'use client';

import { useEffect, useMemo, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { RoomAudioRenderer, RoomContext, StartAudio } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { Welcome } from '@/components/main/welcome_page';
import { Interview } from '@/components/main/interview_page';
import { Summary } from '@/components/main/summary_page';


export function Session() {
    const room = useMemo(() => new Room(), []);
    const [sessionStarted, setSessionStarted] = useState(false);
    const [participantToken, setParticipantToken] = useState(null);
    const [currentStage, setCurrentStage] = useState('welcome'); 
    const [timeLimit, setTimeLimit] = useState(1800);
    const [difficulty, setDifficulty] = useState('medium');

    const title = document.querySelector('.text-title-large')?.textContent;
    const description = document.querySelector('.elfjS')?.textContent;
    const fullProblem = `Title: ${title}, Description: ${description}`;

    const serverUrl="wss://parrot-8ggzczwu.livekit.cloud"

    const goToStage = (stage, time, difficulty) => {
        setCurrentStage(stage);
        if (stage === 'interview') {
            setSessionStarted(true);
            setTimeLimit(time);
            setDifficulty(difficulty);
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
            console.log("Full Problem:", fullProblem);
    }, []);

    useEffect(() => {
      let aborted = false;
      if (sessionStarted && room.state === 'disconnected' && participantToken) {
        const onParticipantConnected = (participant) => {
          console.log(`Participant connected: ${participant.identity}, sending problem description.`);
          // --- Send problem description once agent joins ---
          room.localParticipant.sendText(fullProblem, {
            topic: 'problem',
          }).then(info => {
            console.log(`Sent text with stream ID: ${info.id}`);
          }).catch(e => {
            console.error("Failed to send text", e);
          });
        
          room.localParticipant.sendText(difficulty, {
            topic: 'difficulty',
          }).then(info => {
            console.log(`Sent difficulty with stream ID: ${info.id}`);
          }).catch(e => {
            console.error("Failed to send difficulty", e);
          });
        };
        room.registerTextStreamHandler("request_code", async (reader, participant) => {
          const text = await reader.readAll();
          console.log("📥 Received code request:", text);

          // scrape user code from DOM
          const userCode = Array.from(document.querySelectorAll('.view-line'))
            .map(line => line.textContent)
            .join('\n');

          // send it back
          await room.localParticipant.sendText(userCode, {
            topic: 'user_code',
          });

          console.log("✅ Sent user code back to agent");
        });


        room.on(RoomEvent.ParticipantConnected, onParticipantConnected);

        Promise.all([
          room.localParticipant.setMicrophoneEnabled(true, undefined, {
            preConnectBuffer: true,
          }),
          room.connect(serverUrl, participantToken),
        ]).then(async () => {
        if (aborted) return;

        console.log("✅ Connected to LiveKit");

      }).catch((error) => {
        if (aborted) {
          return;
        }
        });
      }
      return () => {
        aborted = true;
        room.disconnect();
        room.removeAllListeners(RoomEvent.ParticipantConnected);
      };
    }, [room, sessionStarted, participantToken, fullProblem]);

    const StageManager = () => {
        switch (currentStage) {
            case 'welcome':
                return (
                    <Welcome onStartInterview={(time, difficulty) => goToStage('interview', time, difficulty)}/>
                );
            case 'interview':
                return (
                    <Interview 
                      timeLimit={timeLimit}
                      onGoBack={() => goToStage('welcome')}
                      onEndInterview={() => goToStage('summary')}
                    />
                );
            case 'summary':
                return (
                    <Summary onStartOver={() => goToStage('welcome')} />
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