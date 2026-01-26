/**
 * Summary
 * Displays interview scores and feedback once generated.
 * - Shows a loading skeleton while feedback is being prepared (isLoading).
 * - Renders overall score and subsection scores when available (feedback).
 * - Falls back to an error/empty message if feedback is absent after loading.
 *
 * Props:
 * @param {Function} onStartOver - Callback to start a new interview session.
 * @param {string} feedback - JSON string containing interview feedback and scores.
 * @param {boolean} isLoading - Whether feedback is currently being generated.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Summary = ({ onStartOver, feedback, isLoading }) => {
  const [showFullFeedback, setShowFullFeedback] = useState(false);

  // Parse feedback JSON
  let scores = null;
  if (feedback && typeof feedback === "string") {
    try {
      scores = JSON.parse(feedback);
    } catch (e) {
      console.error("Failed to parse feedback:", e);
    }
  }

  // Extract dimension names for display
  const getDimensionName = (key) => {
    const names = {
      problem_comprehension: "Problem Comprehension",
      algorithmic_approach: "Algorithmic Approach",
      coding_implementation: "Coding Implementation",
      testing_debugging: "Testing & Debugging",
      complexity_analysis: "Complexity Analysis",
      communication_collaboration: "Communication",
      execution_time_management: "Time Management",
      technical_foundations: "Technical Foundations",
    };
    return names[key] || key;
  };

  return (
    <div className="flex flex-col items-center w-full h-full pt-12 px-2 pb-16">
      {/* Overall Score - Centered */}
      {!isLoading && scores && scores.overall_score !== undefined && (
        <div className="text-center mb-2">
          <h3 className="font-semibold text-xs text-muted-foreground mb-0">Overall Score</h3>
          <span className="text-3xl font-bold text-primary">
            {scores.overall_score}/4
          </span>
        </div>
      )}

      {/* Scrollable card for dimension scores */}
      <div className="w-full bg-gray-100 rounded-lg p-3 flex-grow overflow-hidden flex flex-col max-h-[140px] max-w-[320px] mx-auto">
        {isLoading ? (
          // Loading state
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
            <h2 className="font-medium text-sm">Preparing Interview Feedback...</h2>
            <div className="space-y-2 w-3/4">
              <div className="h-2 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-2 bg-gray-300 rounded w-5/6 mx-auto animate-pulse"></div>
              <div className="h-2 bg-gray-300 rounded w-4/6 mx-auto animate-pulse"></div>
            </div>
          </div>
        ) : scores && scores.overall_score !== undefined ? (
          // Success state: display dimension scores
          <div className="h-full overflow-y-auto pr-1 space-y-1.5">
            {/* Dimension Scores */}
            {scores.dimension_scores &&
              Object.entries(scores.dimension_scores).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-2 py-1"
                  >
                    <span className="text-xs font-medium">
                      {getDimensionName(key)}
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      {value.score}/4
                    </span>
                  </div>
                )
              )}
          </div>
        ) : (
          // Empty/error state
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="font-medium text-sm mb-1">No Feedback Available</h2>
            <p className="text-xs">There was an issue generating feedback for this interview session.</p>
          </div>
        )}
      </div>

      {/* Action buttons: restart the interview flow and view full feedback */}
      <div className="absolute bottom-8 flex gap-2">
        <Button 
          onClick={() => setShowFullFeedback(true)} 
          className="text-sm h-9"
          variant="outline"
          disabled={isLoading || !scores}
        >
          Full Feedback
        </Button>
        <Button onClick={onStartOver} className="text-sm h-9">
          Start New Interview
        </Button>
      </div>

      {/* Full Feedback Modal Panel */}
      {showFullFeedback && scores && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{ zIndex: 9999999, position: 'fixed', overflow: 'hidden' }}
          onClick={() => setShowFullFeedback(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            style={{ zIndex: 10000000, position: 'relative', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between flex-shrink-0 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Interview Feedback</h2>
              <button
                onClick={() => setShowFullFeedback(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none flex-shrink-0 w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="p-6 space-y-6 overflow-y-auto flex-grow scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {/* Overall Score */}
              <div className="text-center pb-2 border-b">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Overall Score</h3>
                <span className="text-5xl font-bold text-primary">
                  {scores.overall_score}/4
                </span>
              </div>

              {/* Dimension Scores with Feedback */}
              {scores.dimension_scores &&
                Object.entries(scores.dimension_scores).map(([key, value]) => (
                  <div key={key} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-base">
                        {getDimensionName(key)}
                      </h3>
                      <span className="text-lg font-bold text-primary">
                        {value.score}/4
                      </span>
                    </div>
                    {value.feedback && (
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {value.feedback}
                      </p>
                    )}
                  </div>
                ))}

              {/* Overall Feedback */}
              {scores.overall_feedback && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-base mb-2">Summary</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {scores.overall_feedback}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};