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
  const [timeLimit, setTimeLimit] = useState(1800);
  const [difficulty, setDifficulty] = useState("medium");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTimeValue, setCustomTimeValue] = useState(30); 
  
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

  // Handle time limit selection
  const handleTimeLimitChange = (value) => {
    if (value === "custom") { // Show custom input field
      setShowCustomInput(true);
      setTimeLimit(customTimeValue * 60);
    } else { // Default options
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
  
  const handleCustomTimeChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setCustomTimeValue(value);
      setTimeLimit(value * 60); // Convert minutes to seconds
    }
  };

  return (
    <div>
      <div className="flex flex-col items-center justify-center text-center space-y-4">
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

        <Button onClick={() => onStartInterview(timeLimit, difficulty)} className="absolute bottom-10">
          Start Interview
        </Button>
      </div>
    </div>
  );
};