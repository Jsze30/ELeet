'use client';

import { useEffect, useMemo, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { RoomAudioRenderer, RoomContext, StartAudio } from '@livekit/components-react';
import { Welcome } from '@/components/main/welcome_page';
import { Interview } from '@/components/main/interview_page';
import { Summary } from '@/components/main/summary_page';


export function Session() {
    const [room, setRoom] = useState(null);
    const [sessionStarted, setSessionStarted] = useState(false);
    const [participantToken, setParticipantToken] = useState(null);
    const [currentStage, setCurrentStage] = useState('welcome'); 
    const [timeLimit, setTimeLimit] = useState(1800);
    const [difficulty, setDifficulty] = useState('medium');
    const [feedback, setFeedback] = useState('');
    const [loadingFeedback, setLoadingFeedback] = useState(false);
    const [agentJoined, setAgentJoined] = useState(false);

    const title = document.querySelector('.text-title-large')?.textContent;
    const description = document.querySelector('.elfjS')?.textContent;
    const fullProblem = `Title: ${title}, Description: ${description}`;

    // Update fullProblem when title changes (switching to a new problem)
    let lastTitle = document.querySelector('.text-title-large').textContent;
    const observer = new MutationObserver(() => {
      const currentTitle = document.querySelector('.text-title-large').textContent;
      if (currentTitle !== lastTitle) {
        lastTitle = currentTitle;
        console.log("Title changed → fetching new problem");

        // Give the DOM a moment to load after navigation
        setTimeout(() => {
          const title = document.querySelector('.text-title-large')?.textContent;
          const description = document.querySelector('.elfjS')?.textContent;
          const fullProblem = `Title: ${title}, Description: ${description}`;
          console.log(fullProblem);
          goToStage('welcome'); // Reset to welcome stage on new problem
        }, 500);
      }
    });

    observer.observe(document, { subtree: true, childList: true });


    const serverUrl="wss://parrot-8ggzczwu.livekit.cloud"

    const goToStage = async (stage, time, difficulty) => {
        setCurrentStage(stage);
        if (stage === 'welcome') {
            setSessionStarted(false);
            setAgentJoined(false)
        }
        else if (stage === 'interview') {
            const token = await fetchParticipantToken();
              if (token) {
                setRoom(new Room());
                setSessionStarted(true);
                setTimeLimit(time);
                setDifficulty(difficulty);
                setAgentJoined(false)
              }
        }
        else if (stage === 'summary') {
        }
    };

      const fetchParticipantToken = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:5000/getToken`);
            const data = await res.json();
            console.log("Token received:", data.token);
            setParticipantToken(data.token);
            return data.token;
        } catch (error) {
            console.error("Error fetching token:", error);
            return null;
        } 
    };


    const endInterview = async () => {
        setLoadingFeedback(true);
        room.registerTextStreamHandler("interview_feedback", async (reader, participant) => {
                const text = await reader.readAll();
                console.log("📥 Received feedback:", text);
                setFeedback(text);
                setLoadingFeedback(false);
                setSessionStarted(false);
            });
        try {
            await room.localParticipant.sendText('{"action":"end_interview"}', {
                topic: 'end_interview',
            });
            console.log("✅ Sent end interview signal");
            goToStage('summary');
        } catch (e) {
            console.error("Error ending interview:", e);
            setLoadingFeedback(false);
            setSessionStarted(false);
            goToStage('summary');
        }
    };


    useEffect(() => {
      if (!room || !participantToken || !sessionStarted) return;
      let aborted = false;
      if (sessionStarted && room.state === 'disconnected' && participantToken) {
        const onParticipantConnected = (participant) => {
          console.log(`Participant connected: ${participant.identity}, sending problem description.`);
          setAgentJoined(true);
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
        if (room.state !== 'disconnected') {
          room.disconnect();
        }
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
                      onEndInterview={() => endInterview()}
                      agentJoined={agentJoined}
                    />
                );
            case 'summary':
                return (
                    <Summary 
                      onStartOver={() => goToStage('welcome')} 
                      feedback={feedback}
                      isLoading={loadingFeedback}
                    />
                );
            default:
                return <div>Unknown stage</div>;
        }
    };

    return (
         <>
          {room ? (
            <RoomContext.Provider value={room}>
              {currentStage === 'interview' && (
                <>
                  <RoomAudioRenderer />
                  <StartAudio />
                </>
              )}
            </RoomContext.Provider>
          ) : null}
          {StageManager()}
        </>
    )
}