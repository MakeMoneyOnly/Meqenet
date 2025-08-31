import React from 'react';
import { Card, CardContent, CardHeader } from './Card';

export interface PaymentPlanCardProps {
  planName: string;
  description: string;
  installments: number;
  interestRate: string;
  isSelected?: boolean;
  onSelect: () => void;
}

export const PaymentPlanCard = ({ planName, description, installments, interestRate, isSelected = false, onSelect }: PaymentPlanCardProps) => {
  const selectionClasses = isSelected ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300';

  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-shadow ${selectionClasses}`}
      onClick={onSelect}
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
    >
      <CardHeader>
        <h4 className="font-semibold text-lg">{planName}</h4>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="font-bold text-xl">{installments}</div>
            <div className="text-xs text-gray-500">Installments</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-xl">{interestRate}</div>
            <div className="text-xs text-gray-500">Interest</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
