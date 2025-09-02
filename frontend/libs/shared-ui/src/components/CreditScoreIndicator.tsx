import React from 'react';

export interface CreditScoreIndicatorProps {
  score: number;
  maxScore?: number;
  showDetails?: boolean;
  lastUpdated?: string;
  nextUpdate?: string;
  factors?: {
    positive: string[];
    negative: string[];
  };
  className?: string;
}

export const CreditScoreIndicator: React.FC<CreditScoreIndicatorProps> = ({
  score,
  maxScore = 850,
  showDetails = true,
  lastUpdated,
  nextUpdate,
  factors,
  className = '',
}) => {
  // Calculate score percentage and rating
  const percentage = (score / maxScore) * 100;
  
  const getScoreRating = (score: number): { label: string; color: string; bgColor: string } => {
    if (score >= 750) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-500' };
    if (score >= 700) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-500' };
    if (score >= 650) return { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-500' };
    if (score >= 600) return { label: 'Poor', color: 'text-orange-600', bgColor: 'bg-orange-500' };
    return { label: 'Very Poor', color: 'text-red-600', bgColor: 'bg-red-500' };
  };

  const rating = getScoreRating(score);

  // Calculate rotation angle for semi-circle gauge (180 degrees total)
  const rotation = (percentage / 100) * 180 - 90;

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Credit Score</h3>
        
        {/* Semi-circle Gauge */}
        <div className="relative w-48 h-24 mx-auto mb-4">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 200 100"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label={`Credit score gauge showing ${score} out of ${maxScore}`}
          >
            {/* Background arc */}
            <path
              d="M 10 90 A 80 80 0 0 1 190 90"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="20"
              strokeLinecap="round"
            />
            
            {/* Score arc */}
            <path
              d="M 10 90 A 80 80 0 0 1 190 90"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="20"
              strokeLinecap="round"
              strokeDasharray={`${(percentage / 100) * 251.2} 251.2`}
              className="transition-all duration-1000 ease-out"
            />
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="25%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="75%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            
            {/* Pointer */}
            <g transform={`translate(100, 90) rotate(${rotation})`}>
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="-70"
                stroke="#1f2937"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="0" cy="0" r="6" fill="#1f2937" />
            </g>
          </svg>
          
          {/* Score display */}
          <div className="absolute inset-0 flex items-end justify-center pb-2">
            <div>
              <div className="text-3xl font-bold text-gray-900">{score}</div>
              <div className="text-xs text-gray-500">out of {maxScore}</div>
            </div>
          </div>
        </div>

        {/* Rating badge */}
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${rating.bgColor} text-white`}>
          {rating.label}
        </span>
      </div>

      {showDetails && (
        <>
          {/* Update information */}
          {(lastUpdated || nextUpdate) && (
            <div className="border-t border-gray-200 pt-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {lastUpdated && (
                  <div>
                    <span className="text-gray-500">Last Updated:</span>
                    <span className="block font-medium text-gray-900">
                      {new Date(lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {nextUpdate && (
                  <div>
                    <span className="text-gray-500">Next Update:</span>
                    <span className="block font-medium text-gray-900">
                      {new Date(nextUpdate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Score factors */}
          {factors && (factors.positive.length > 0 || factors.negative.length > 0) && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Key Factors</h4>
              
              {factors.positive.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-xs font-medium text-green-600 uppercase tracking-wide mb-2">
                    Positive Factors
                  </h5>
                  <ul className="space-y-1" role="list" aria-label="Positive credit factors">
                    {factors.positive.map((factor, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-700">
                        <svg
                          className="flex-shrink-0 h-4 w-4 text-green-500 mt-0.5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {factors.negative.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-red-600 uppercase tracking-wide mb-2">
                    Areas for Improvement
                  </h5>
                  <ul className="space-y-1" role="list" aria-label="Areas for credit improvement">
                    {factors.negative.map((factor, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-700">
                        <svg
                          className="flex-shrink-0 h-4 w-4 text-red-500 mt-0.5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Tips for improvement */}
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-blue-700">
                  Make timely payments and keep credit utilization low to improve your score.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};