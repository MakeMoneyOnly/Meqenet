import React from 'react';

export interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export const ProgressIndicator = ({
  currentStep,
  totalSteps: _totalSteps,
  steps,
}: ProgressIndicatorProps) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li
            key={step}
            className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}
          >
            {stepIdx < currentStep ? (
              <>
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="h-0.5 w-full bg-blue-600" />
                </div>
                <a
                  href="#"
                  className="relative w-8 h-8 flex items-center justify-center bg-blue-600 rounded-full hover:bg-blue-900"
                >
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
                  <span className="sr-only">{step}</span>
                </a>
              </>
            ) : stepIdx === currentStep ? (
              <>
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <a
                  href="#"
                  className="relative w-8 h-8 flex items-center justify-center bg-white border-2 border-blue-600 rounded-full"
                  aria-current="step"
                >
                  <span
                    className="h-2.5 w-2.5 bg-blue-600 rounded-full"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{step}</span>
                </a>
              </>
            ) : (
              <>
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <a
                  href="#"
                  className="group relative w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full hover:border-gray-400"
                >
                  <span
                    className="h-2.5 w-2.5 bg-transparent rounded-full group-hover:bg-gray-300"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{step}</span>
                </a>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
