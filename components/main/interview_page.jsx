import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export const Interview = ({
  onEndInterview,
  timeLimit = 60,
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
  const handleResume = () => {
    setIsRunning(true)
  }
  const handlePause = () => {
    setIsRunning(false)
  }
  const handleReset = () => {
    setTimeRemaining(timeLimit)
    setIsRunning(false)
  }
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="text-8xl font-bold text-gray-900 dark:text-gray-50">
        {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, "0")}
      </div>
      <div className="flex gap-4">
        {isRunning ? <Button onClick={handlePause} disabled={!isRunning}>
          Pause
        </Button> : <Button onClick={handleResume} disabled={isRunning}>
          Resume
        </Button>} 
        
        <Button onClick={handleReset}>Reset</Button>
      </div>
       <Button onClick={onEndInterview}>
          End Interview
        </Button>
    </div>
  )
}