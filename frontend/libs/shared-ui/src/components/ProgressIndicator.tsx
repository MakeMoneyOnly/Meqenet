import React from 'react';

export interface ProgressIndicatorProps {
  currentStep: number;
  steps: string[];
}

export const ProgressIndicator = ({
  currentStep,
  steps,
}: ProgressIndicatorProps): React.JSX.Element => {
  const totalSteps = steps.length;
  return (
    <nav aria-label="Progress">
      <ol className="flex items-start">
        {steps.map((step, stepIdx) => {
          const status =
            stepIdx < currentStep - 1
              ? 'complete'
              : stepIdx === currentStep - 1
                ? 'current'
                : 'upcoming';
          const isLastStep = stepIdx === totalSteps - 1;

          return (
            <li
              key={step}
              className={`relative ${!isLastStep ? 'flex-1' : ''}`}
            >
              {status === 'complete' ? (
                <>
                  <div
                    className="absolute inset-0 flex items-center"
                    aria-hidden="true"
                  >
                    <div className="h-0.5 w-full bg-purple-600" />
                  </div>
                  <div className="relative flex flex-col items-center">
                    <span className="relative w-8 h-8 flex items-center justify-center bg-purple-600 rounded-full">
                      <svg
                        className="w-5 h-5 text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <span className="mt-2 text-sm font-medium text-gray-900">
                      {step}
                    </span>
                  </div>
                </>
              ) : status === 'current' ? (
                <>
                  <div
                    className="absolute inset-0 flex items-center"
                    aria-hidden="true"
                  >
                    <div className="h-0.5 w-full bg-gray-200" />
                  </div>
                  <div className="relative flex flex-col items-center">
                    <span
                      className="relative w-8 h-8 flex items-center justify-center bg-white border-2 border-purple-600 rounded-full"
                      aria-current="step"
                    >
                      <span
                        className="h-2.5 w-2.5 bg-purple-600 rounded-full"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="mt-2 text-sm font-medium text-purple-600">
                      {step}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="absolute inset-0 flex items-center"
                    aria-hidden="true"
                  >
                    <div className="h-0.5 w-full bg-gray-200" />
                  </div>
                  <div className="relative flex flex-col items-center">
                    <span className="group relative w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full">
                      <span
                        className="h-2.5 w-2.5 bg-transparent rounded-full"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="mt-2 text-sm font-medium text-gray-500">
                      {step}
                    </span>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
