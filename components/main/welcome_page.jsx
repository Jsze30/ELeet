/**
 * Welcome component
 * Features: lets user configure interview time limit (preset or custom minutes) 
 *    and difficulty before starting.
 * Calls onStartInterview(seconds, difficulty).
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const Welcome = ({
  onStartInterview,
}) => {
  // timeLimit stored in seconds (default 30 minutes = 1800)
  const [timeLimit, setTimeLimit] = useState(1800);
  // difficulty level selection
  const [difficulty, setDifficulty] = useState("medium");
  // toggles custom time input visibility
  const [showCustomInput, setShowCustomInput] = useState(false);
  // custom time input value in minutes
  const [customTimeValue, setCustomTimeValue] = useState(30); 
  
  // Update difficulty based on selection
  const handleDifficultyChange = (value) => {
    switch (value) {
      case "easy":
        setDifficulty("easy");
        break;
      case "medium":
        setDifficulty("medium");
        break;
      case "hard":
        setDifficulty("hard");
        break;
      default:
        setDifficulty("medium");
    }
  };

  // Update time limit from preset or reveal custom input
  const handleTimeLimitChange = (value) => {
    if (value === "custom") {
      setShowCustomInput(true);
      setTimeLimit(customTimeValue * 60);
    } else {
      setShowCustomInput(false);
      switch (value) {
        case "short":
          setTimeLimit(15 * 60);
          break;
        case "medium":
          setTimeLimit(30 * 60);
          break;
        case "long":
          setTimeLimit(45 * 60);
          break;
        default:
          setTimeLimit(30 * 60);
      }
    }
  };
  
  // Handle change in custom minutes input
  const handleCustomTimeChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setCustomTimeValue(value);
      setTimeLimit(value * 60);
    }
  };

  return (
    <div>
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        {/* Time limit selector (presets + custom) */}
        <Select onValueChange={handleTimeLimitChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Limit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="short">15 Minutes</SelectItem>
            <SelectItem value="medium">30 Minutes</SelectItem>
            <SelectItem value="long">45 Minutes</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Custom minutes input (shown only when 'Custom' selected) */}
        {showCustomInput && (
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              placeholder="30"
              onChange={handleCustomTimeChange}
              className="w-[100px]"
              min="1"
            />
            <span className="text-sm text-gray-500">minutes</span>
          </div>
        )}

        {/* Difficulty selector */}
        <Select onValueChange={handleDifficultyChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>

        {/* Start button triggers parent with configured settings */}
        <Button onClick={() => onStartInterview(timeLimit, difficulty)} className="absolute bottom-10">
          Start Interview
        </Button>
      </div>
    </div>
  );
};