/**
 * Session
 * Orchestrates the full interview lifecycle:
 *  - Extracts current coding problem from page DOM.
 *  - Manages stage transitions (welcome -> interview -> summary).
 *  - Connects to LiveKit room and exchanges text (problem, code, difficulty).
 *  - Receives feedback after ending interview.
 */
"use client";

import { useEffect, useState } from "react";
import { Room, RoomEvent } from "livekit-client";
import {
  RoomAudioRenderer,
  RoomContext,
  StartAudio,
} from "@livekit/components-react";
import { Welcome } from "@/components/main/welcome_page";
import { Interview } from "@/components/main/interview_page";
import { Summary } from "@/components/main/summary_page";

export function Session() {
  // LiveKit room instance
  const [room, setRoom] = useState(null);
  // Whether a session is active (interview in progress)
  const [sessionStarted, setSessionStarted] = useState(false);
  // LiveKit participant token
  const [participantToken, setParticipantToken] = useState(null);
  // UI stage: 'welcome' | 'interview' | 'summary'
  const [currentStage, setCurrentStage] = useState("welcome");
  // Interview settings
  const [timeLimit, setTimeLimit] = useState(1800);
  const [difficulty, setDifficulty] = useState("medium");
  // AI feedback + loading state
  const [feedback, setFeedback] = useState("");
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  // Whether remote agent (AI participant) has connected
  const [agentJoined, setAgentJoined] = useState(false);

  // Grab current problem title + description from host page (LeetCode-like DOM)
  const title = document.querySelector(".text-title-large")?.textContent;
  const description = document.querySelector(".elfjS")?.textContent;
  const fullProblem = `Title: ${title}, Description: ${description}`;

    // Watch for problem changes (observing when title changes) → reset to welcome
    let lastTitle = document.querySelector('.text-title-large').textContent;
    const observer = new MutationObserver(() => {
      const currentTitle = document.querySelector('.text-title-large').textContent;
      if (currentTitle !== lastTitle) {
        lastTitle = currentTitle;
        // Delay to allow page to finish rendering
        setTimeout(() => {
          const title = document.querySelector('.text-title-large')?.textContent;
          const description = document.querySelector('.elfjS')?.textContent;
          const fullProblem = `Title: ${title}, Description: ${description}`;
          // Reset flow for new problem
          goToStage('welcome');
        }, 500);
      }
    });
    observer.observe(document, { subtree: true, childList: true });

  // const serverUrl="wss://parrot-8ggzczwu.livekit.cloud"

  const serverUrl = __DEV__
    ? "wss://eleet-dev-yrih4rxn.livekit.cloud" // Your new dev project URL
    : "wss://parrot-8ggzczwu.livekit.cloud"; // Production URL

  // Stage transition handler
  const goToStage = async (stage, time, difficulty) => {
    setCurrentStage(stage);
    if (stage === "welcome") {
      setSessionStarted(false);
      setAgentJoined(false);
    } else if (stage === "interview") {
      const token = await fetchParticipantToken();
      if (token) {
        setRoom(new Room());
        setSessionStarted(true);
        setTimeLimit(time);
        setDifficulty(difficulty);
        setAgentJoined(false);
      }
    }
  };

  // Retrieve LiveKit participant token from backend.
  const fetchParticipantToken = async () => {
    try {
      // const res = await fetch(`https://parrot-wxt.onrender.com/getToken`);
      const tokenUrl = __DEV__
        ? "http://localhost:8080/getToken" // Local token server
        : "https://parrot-wxt.onrender.com/getToken"; // Production token server

      const authInfo = await chrome.runtime.sendMessage({ type: "CLERK_GET_AUTH" });
      const clerkUserId = authInfo?.userId;
      const res = await fetch(`${tokenUrl}?userId=${clerkUserId}`);
      // console.log("🎟️ FRONTEND: Fetching token from:", tokenUrl);
      const data = await res.json();
      setParticipantToken(data.token);
      return data.token;
    } catch (error) {
      console.error("Error fetching token:", error);
      return null;
    }
  };

  /**
   * End interview:
   *  - Register feedback text stream handler (listens for agent's feedback blob).
   *  - Send end_interview signal.
   *  - Switch to summary stage.
   */
  const endInterview = async () => {
    setLoadingFeedback(true);
    room.registerTextStreamHandler(
      "interview_feedback",
      async (reader, participant) => {
        const text = await reader.readAll();
        setFeedback(text);
        setLoadingFeedback(false);
        setSessionStarted(false);
      }
    );
    try {
      await room.localParticipant.sendText('{"action":"end_interview"}', {
        topic: "end_interview",
      });
      goToStage("summary");
    } catch (e) {
      console.error("Error ending interview:", e);
      setLoadingFeedback(false);
      setSessionStarted(false);
      goToStage("summary");
    }
  };

  useEffect(() => {
    // console.log("pk", import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
    // console.log("syncHost", import.meta.env.VITE_CLERK_SYNC_HOST);

    // Connect to room & set up text handlers when starting interview
    if (!room || !participantToken || !sessionStarted) return;
    let aborted = false;

    if (sessionStarted && room.state === "disconnected" && participantToken) {
      // Fires when agent connects; send problem + difficulty to agent
      const onParticipantConnected = (participant) => {
        setAgentJoined(true);
        room.localParticipant
          .sendText(fullProblem, { topic: "problem" })
          .catch(console.error);
        room.localParticipant
          .sendText(difficulty, { topic: "difficulty" })
          .catch(console.error);
      };

      // Agent requests user code snapshot
      room.registerTextStreamHandler(
        "request_code",
        async (reader, participant) => {
          await reader.readAll();
          // Scrape code editor lines and join them
          const userCode = Array.from(document.querySelectorAll(".view-line"))
            .map((line) => line.textContent)
            .join("\n");
          // Send user code to agent
          await room.localParticipant.sendText(userCode, {
            topic: "user_code",
          });
        }
      );

      room.on(RoomEvent.ParticipantConnected, onParticipantConnected);

      // Enable mic early, then connect
      Promise.all([
        room.localParticipant.setMicrophoneEnabled(true, undefined, {
          preConnectBuffer: true,
        }),
        room.connect(serverUrl, participantToken),
      ]).catch((error) => {
        if (aborted) return;
      });
    }

    return () => {
      // Cleanup on unmount / dependency change
      aborted = true;
      if (room.state !== "disconnected") {
        room.disconnect();
      }
      room.removeAllListeners(RoomEvent.ParticipantConnected);
    };
  }, [room, sessionStarted, participantToken, fullProblem, difficulty]);

  // Renders current stage component.
  const StageManager = () => {
    switch (currentStage) {
      case "welcome":
        return (
          <Welcome
            onStartInterview={(time, difficulty) =>
              goToStage("interview", time, difficulty)
            }
          />
        );
      case "login/signup":
        return (
          <>
          </>
        );
      case "interview":
        return (
          <Interview
            timeLimit={timeLimit}
            onGoBack={() => goToStage("welcome")}
            onEndInterview={() => endInterview()}
            agentJoined={agentJoined}
          />
        );
      case "summary":
        return (
          <Summary
            onStartOver={() => goToStage("welcome")}
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
      {/* Provide room context & audio only during interview */}
      {room ? (
        <RoomContext.Provider value={room}>
          {currentStage === "interview" && (
            <>
              <RoomAudioRenderer />
              <StartAudio />
            </>
          )}
        </RoomContext.Provider>
      ) : null}
      {StageManager()}
    </>
  );
}

// const container = {
//   width: 320,
//   padding: 12,
//   fontFamily: "system-ui, sans-serif",
// };

const text = {
  marginTop: 12,
  fontSize: 14,
};

// const extensionRootStyle = {
//   fontFamily: "system-ui, sans-serif",
// };

const resetStyle = {
  boxSizing: "border-box",
  margin: 0,
  padding: 0,
};
