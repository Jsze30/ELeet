/**
 * Summary
 * Displays interview feedback once generated.
 * - Shows a loading skeleton while feedback is being prepared (isLoading).
 * - Renders markdown feedback when available (feedback).
 * - Falls back to an error/empty message if feedback is absent after loading.
 *
 * Props:
 * @param {Function} onStartOver - Callback to start a new interview session.
 * @param {string} feedback - Markdown string containing interview feedback.
 * @param {boolean} isLoading - Whether feedback is currently being generated.
 */
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";


export const Summary = ({ onStartOver, feedback, isLoading }) => {
  return (
    // Root vertical layout; centers content and anchors restart button at bottom
    <div className="flex flex-col items-center w-full h-full pt-14 px-2 pb-20">
      {/* Scrollable card that swaps between loading, feedback, or empty states */}
      <div className="w-full bg-muted rounded-lg shadow p-3 mb-2 flex-grow overflow-hidden flex flex-col max-h-[220px] max-w-[350px] mx-auto">
        {isLoading ? (
          // Loading state: skeleton bars mimic forthcoming feedback structure
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
            <h2 className="font-medium text-base">Preparing Interview Feedback...</h2>
            <div className="space-y-2 w-3/4">
              <div className="h-2 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-2 bg-gray-300 rounded w-5/6 mx-auto animate-pulse"></div>
              <div className="h-2 bg-gray-300 rounded w-4/6 mx-auto animate-pulse"></div>
            </div>
          </div>
        ) : feedback ? (
          // Success state: feedback available; markdown rendered inside scrollable area
          <div className="h-full overflow-y-auto pr-1 px-2 max-w-[350px]">
            <h2 className="font-medium text-base mb-2 sticky top-0 bg-muted">Interview Feedback</h2>
            <div className="prose prose-xs text-sm">
              <ReactMarkdown>
                {feedback}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          // Empty/error state: feedback generation failed or returned nothing
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="font-medium text-base mb-1">No Feedback Available</h2>
            <p className="text-sm">There was an issue generating feedback for this interview session.</p>
          </div>
        )}
      </div>
      {/* Action: restart the interview flow */}
      <Button 
        onClick={onStartOver} 
        className="absolute bottom-10"
      >
        Start New Interview
      </Button>
    </div>
  );
};