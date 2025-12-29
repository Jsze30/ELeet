/**
 * Interview
 * Handles live interview session state.
 * - Displays a countdown from timeLimit (seconds).
 * - Shows agent connection status (agentJoined).
 * - Allows ending the interview only after agent connects.
 *
 * Props:
 * @param {Function} onEndInterview - Trigger when user ends interview.
 * @param {Function} onGoBack - Navigate back to previous screen.
 * @param {number} timeLimit - Total time in seconds (default 60).
 * @param {boolean} agentJoined - Whether remote agent has connected.
 */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LiveAudioVisualizer } from 'react-audio-visualize';
import { useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";

function AgentAudioVisualizer() {
  // 1) Get subscribed microphone tracks (local + remote)
  const tracks = useTracks(
    [{ source: Track.Source.Microphone, withPlaceholder: false }],
    { onlySubscribed: true }
  );

  // 2) Pick remote mic (agent)
  const agentTrackRef = useMemo(() => {
    return tracks.find((t) => !t.participant.isLocal) ?? null;
  }, [tracks]);

  const [mediaRecorder, setMediaRecorder] = useState(null);

  useEffect(() => {
    setMediaRecorder((prev) => {
      try {
        if (prev && prev.state !== "inactive") prev.stop();
      } catch {}
      return null;
    });

    if (!agentTrackRef) return;

    const lkTrack = agentTrackRef.publication?.track;
    const mst = lkTrack?.mediaStreamTrack;
    if (!mst) return;

    const stream = new MediaStream([mst]);

    try {
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = () => {};
      recorder.start(250);
      setMediaRecorder(recorder);

      return () => {
        try {
          if (recorder.state !== "inactive") recorder.stop();
        } catch {}
      };
    } catch {}
  }, [agentTrackRef]);

  if (!mediaRecorder) return null;

  return (
    <div className="flex w-full h-full justify-center">
      <LiveAudioVisualizer
        mediaRecorder={mediaRecorder}
        width={100}
        height={50}
        barWidth={4}
        gap={3}
        backgroundColor="transparent"
        barColor="#28004f"
        minDecibels={-90}
        maxDecibels={-10}
        fftSize={8192}
      />
    </div>
  );
}


export const Interview = ({
  onEndInterview,
  onGoBack,
  timeLimit = 60,
  agentJoined
}) => {
  // Remaining seconds in countdown
  const [timeRemaining, setTimeRemaining] = useState(timeLimit)
  // Controls whether countdown is actively decrementing
  const [isRunning, setIsRunning] = useState(true)
  const [mediaRecorder, setMediaRecorder] = useState();

  useEffect(() => {
    // Decrement timer every 1s while running; stop at zero
    let interval
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1)
      }, 1000)
    } else if (timeRemaining === 0) {
      setIsRunning(false)
    }
    return () => clearInterval(interval) // Cleanup interval on re-run/unmount
  }, [isRunning, timeRemaining])

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Countdown in MM:SS format */}
      {/* <div className="absolute top-5 right-5 text-2xl font-bold text-gray-900 dark:text-gray-50">
        {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, "0")}
      </div> */}
      <div className="absolute top-4 right-5 bg-[#3B3D55] text-white text-2xl font-bold px-2 py-0.5 rounded-lg shadow-md">
        {Math.floor(timeRemaining / 60)}:
        {String(timeRemaining % 60).padStart(2, "0")}
      </div>

      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Agent connection indicator (color + pulsating while waiting) */}
        {!agentJoined && (
          <div className={`flex items-center ${agentJoined ? "text-green-500" : "text-yellow-500"}`}>
            <div className={`w-3 h-3 rounded-full mr-2 ${agentJoined ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`}></div>
            <span className="font-medium">
              {"Waiting for agent..."}
            </span>
          </div>
        )}
        <AgentAudioVisualizer agentJoined={agentJoined} />
      </div>



      {/* Navigation back (always enabled) */}
      <Button onClick={onGoBack} className="absolute bottom-10 left-10">
          Go Back
        </Button>

      {/* End interview (disabled until agent present) */}
       <Button onClick={onEndInterview} disabled={!agentJoined}
          className={!agentJoined ? "opacity-50 cursor-not-allowed absolute bottom-10 right-10" : "absolute bottom-10 right-10"}>
          End Interview
        </Button>
    </div>
  )
}