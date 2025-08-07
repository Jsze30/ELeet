import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

export const Summary = ({ onStartOver, feedback, isLoading }) => {
  return (
    <div className="flex flex-col items-center w-full h-full pt-14 px-2 pb-2">
      <div className="w-full bg-muted rounded-lg shadow p-3 mb-2 flex-grow overflow-hidden flex flex-col max-h-[290px] max-w-[380px] mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
            <h2 className="font-medium text-base">Preparing Interview Feedback...</h2>
            <div className="space-y-2 w-3/4">
              <div className="h-2 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-2 bg-gray-300 rounded w-5/6 mx-auto animate-pulse"></div>
              <div className="h-2 bg-gray-300 rounded w-4/6 mx-auto animate-pulse"></div>
            </div>
          </div>
        ) : feedback ? (
          <div className="h-full overflow-y-auto pr-1 px-2">
            <h2 className="font-medium text-base mb-2 sticky top-0 bg-muted">Interview Feedback</h2>
            <div className="prose prose-xs max-w-[350px] text-sm">
              <ReactMarkdown>
                {feedback}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="font-medium text-base mb-1">No Feedback Available</h2>
            <p className="text-sm">There was an issue generating feedback for this interview session.</p>
          </div>
        )}
      </div>
      
      <div className="mt-auto w-full flex justify-center">
        <Button 
          onClick={onStartOver} 
          className="px-6 py-1 text-sm font-medium"
          size="default"
        >
          Start New Interview
        </Button>
      </div>
    </div>
  );
};