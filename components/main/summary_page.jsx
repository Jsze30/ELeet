import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export const Summary = ({ onStartOver }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
       <Button onClick={onStartOver} className="absolute bottom-10">
          Start New Interview
        </Button>
    </div>
  )
}