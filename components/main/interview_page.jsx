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
      <div className="absolute top-5 right-5 bg-[#3B3D55] text-white text-2xl font-bold px-3 py-1 rounded-lg shadow-md">
        {Math.floor(timeRemaining / 60)}:
        {String(timeRemaining % 60).padStart(2, "0")}
      </div>

      {/* Agent connection indicator (color + pulsating while waiting) */}
      <div className={`flex items-center ${agentJoined ? "text-green-500" : "text-yellow-500"}`}>
        <div className={`w-3 h-3 rounded-full mr-2 ${agentJoined ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`}></div>
        <span className="font-medium">
          {agentJoined ? "Agent connected" : "Waiting for agent..."}
        </span>
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