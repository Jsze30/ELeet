import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export const Interview = ({
  onEndInterview,
  onGoBack,
  timeLimit = 60,
  agentJoined
}) => {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit)
  const [isRunning, setIsRunning] = useState(true)
  useEffect(() => {
    let interval
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1)
      }, 1000)
    } else if (timeRemaining === 0) {
      setIsRunning(false)
    }
    return () => clearInterval(interval)
  }, [isRunning, timeRemaining])
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="absolute top-5 right-5 text-2xl font-bold text-gray-900 dark:text-gray-50">
        {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, "0")}
      </div>
      <div className={`flex items-center ${agentJoined ? "text-green-500" : "text-yellow-500"}`}>
        <div className={`w-3 h-3 rounded-full mr-2 ${agentJoined ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`}></div>
        <span className="font-medium">
          {agentJoined ? "Agent connected" : "Waiting for agent..."}
        </span>
      </div>
      <Button onClick={onGoBack} className="absolute bottom-10 left-10">
          Go Back
        </Button>
       <Button onClick={onEndInterview} disabled={!agentJoined}
          className={!agentJoined ? "opacity-50 cursor-not-allowed absolute bottom-10 right-10" : "absolute bottom-10 right-10"}>
          End Interview
        </Button>
    </div>
  )
}