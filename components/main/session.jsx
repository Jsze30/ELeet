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
  // User subscription plan
  const [plan, setPlan] = useState(null);
  // Whether user has hit their monthly interview limit
  const [limitReached, setLimitReached] = useState(false);

  // Grab current problem title + description from host page (LeetCode-like DOM)
  const title = document.querySelector(".text-title-large")?.textContent;
  const description = document.querySelector(".elfjS")?.textContent;
  const fullProblem = `Title: ${title}, Description: ${description}`;

  // Watch for problem changes (observing when title changes) → reset to welcome
  let lastTitle = document.querySelector(".text-title-large").textContent;
  const observer = new MutationObserver(() => {
    const currentTitle =
      document.querySelector(".text-title-large").textContent;
    if (currentTitle !== lastTitle) {
      lastTitle = currentTitle;
      // Delay to allow page to finish rendering
      setTimeout(() => {
        const title = document.querySelector(".text-title-large")?.textContent;
        const description = document.querySelector(".elfjS")?.textContent;
        const fullProblem = `Title: ${title}, Description: ${description}`;
        // Reset flow for new problem
        goToStage("welcome");
      }, 500);
    }
  });
  observer.observe(document, { subtree: true, childList: true });

  const serverUrl="wss://parrot-8ggzczwu.livekit.cloud" // Production URL
  // const serverUrl="wss://eleet-dev-yrih4rxn.livekit.cloud" // Dev URL

  // Stage transition handler
  const goToStage = async (stage, time, difficulty) => {
    setCurrentStage(stage);
    if (stage === "welcome") {
      setSessionStarted(false);
      setAgentJoined(false);
      setLimitReached(false);
    } else if (stage === "interview") {
      const token = await fetchParticipantToken();
      if (token) {
        setRoom(new Room());
        setSessionStarted(true);
        setTimeLimit(time);
        setDifficulty(difficulty);
        setAgentJoined(false);
        setLimitReached(false);
      }
    }
  };

  // Retrieve LiveKit participant token from backend.
  const fetchParticipantToken = async () => {
    try {
      const tokenUrl = "https://parrot-wxt.onrender.com/getToken"; // Production token server
      // const tokenUrl = "http://localhost:8080/getToken"; // Dev token server

      const authInfo = await chrome.runtime.sendMessage({ type: "CLERK_GET_AUTH" });
      const clerkUserId = authInfo?.userId;
      const res = await fetch(`${tokenUrl}?userId=${clerkUserId}`);
      const data = await res.json();
      
      // Handle limit reached error (429)
      if (!res.ok) {
        setPlan(data.plan);
        setLimitReached(true);
        setCurrentStage("interview");
        return null;
      }
      
      // console.log("🎟️ FRONTEND: Fetching token from:", tokenUrl);
      setParticipantToken(data.token);
      setPlan(data.plan);
      // console.log("users plan:", data.plan);
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
          console.log("USER CODE: ", userCode);
          // Send user code to agent
          await room.localParticipant.sendText(userCode, {
            topic: "user_code",
          });
        }
      );

      // Listen for automatic end_interview signal from agent
      room.registerTextStreamHandler(
        "end_interview",
        async (reader, participant) => {
          await reader.readAll();
          endInterview();
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
      case "interview":
        if (limitReached) {
          return (
            <Interview
              timeLimit={timeLimit}
              onGoBack={() => goToStage("welcome")}
              onEndInterview={() => endInterview()}
              agentJoined={agentJoined}
              limitReached={limitReached}
              plan={plan}
            />
          );
        }
        if (!room) {
          return (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`flex items-center ${agentJoined ? "text-green-500" : "text-yellow-500"}`}>
              <div className={`w-3 h-3 rounded-full mr-2 ${agentJoined ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`}></div>
                <span className="font-medium">
                  {"Connecting You to a Room..."}
                </span>
            </div>
          </div>);
        }
        return (
          <Interview
            timeLimit={timeLimit}
            onGoBack={() => goToStage("welcome")}
            onEndInterview={() => endInterview()}
            agentJoined={agentJoined}
            limitReached={limitReached}
            plan={plan}
          />
        );
      case "summary":
        return (
          <Summary
            onStartOver={() => goToStage("welcome")}
            feedback={feedback}
            isLoading={loadingFeedback}
            plan={plan}
          />
        );
      default:
        return <div>Unknown stage</div>;
    }
  };

  {
    /* Provide room context & audio only during interview */
  }
  return room ? (
    <RoomContext.Provider value={room}>
      {currentStage === "interview" && (
        <>
          <RoomAudioRenderer />
          <StartAudio />
        </>
      )}
      {StageManager()}
    </RoomContext.Provider>
  ) : (
    <>{StageManager()}</>
  );
}