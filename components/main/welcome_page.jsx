import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const parrotLogoUrl = chrome.runtime.getURL("icons/parrot_logo.png");

export const Welcome = ({
  onStartInterview,
}) => {
  const [timeLimit, setTimeLimit] = useState(1800); // Default 30 minutes in seconds
  
  const handleTimeLimitChange = (value) => {
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
  };

  return (
    <div>
      <div className="flex items-center justify-start pl-2">
        <img 
          src={parrotLogoUrl} 
          alt="Parrot Logo" 
          className="h-8 mr-3 rounded" 
        />
        <h3 className="text-xl font-bold">Parrot</h3>
      </div>

    
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
        
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Easy</SelectItem>
            <SelectItem value="dark">Medium</SelectItem>
            <SelectItem value="system">Hard</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => onStartInterview(timeLimit)}>
          Start Interview
        </Button>
      </div>
    </div>
  );
};