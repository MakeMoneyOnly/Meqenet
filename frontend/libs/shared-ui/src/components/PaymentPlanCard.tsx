import React from 'react';

export interface PaymentPlanCardProps {
  planName: string;
  description: string;
  installments: number;
  interestRate: string;
  features?: string[];
  recommended?: boolean;
  isSelected?: boolean;
  onSelect: () => void;
}

export const PaymentPlanCard = ({
  planName,
  description,
  installments,
  interestRate,
  features = [],
  recommended = false,
  isSelected = false,
  onSelect,
}: PaymentPlanCardProps): React.JSX.Element => {
  const selectionClasses = isSelected
    ? 'border-purple-600 ring-2 ring-purple-600'
    : 'border-gray-300';

  return (
    <button
      className={`w-full text-left bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow relative ${selectionClasses}`}
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`Select payment plan: ${planName}`}
      type="button"
    >
      {recommended ? (
        <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
          Recommended
        </div>
      ) : null}
      <div className="mb-4">
        <h4 className="font-semibold text-lg text-gray-900">{planName}</h4>
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <div className="flex justify-between items-center mb-4">
          <div className="text-center">
            <div className="font-bold text-xl text-gray-900">
              {installments}
            </div>
            <div className="text-xs text-gray-500">Installments</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-xl text-gray-900">
              {interestRate}
            </div>
            <div className="text-xs text-gray-500">Interest</div>
          </div>
        </div>
        {features.length > 0 && (
          <ul className="text-sm text-gray-600 space-y-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        )}
      </div>
    </button>
  );
};
