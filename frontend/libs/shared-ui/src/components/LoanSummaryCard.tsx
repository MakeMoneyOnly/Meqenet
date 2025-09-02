import React from 'react';
import { Card, CardContent, CardHeader } from './Card';

export interface LoanDetails {
  loanId: string;
  principalAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  nextPaymentDate: string;
  nextPaymentAmount: number;
  installmentsPaid: number;
  totalInstallments: number;
  status: 'active' | 'overdue' | 'completed' | 'defaulted';
  currency?: string;
}

export interface LoanSummaryCardProps {
  loan: LoanDetails;
  onViewDetails?: () => void;
  onMakePayment?: () => void;
  className?: string;
}

export const LoanSummaryCard: React.FC<LoanSummaryCardProps> = ({
  loan,
  onViewDetails,
  onMakePayment,
  className = '',
}) => {
  const progressPercentage = (loan.paidAmount / loan.totalAmount) * 100;
  const currency = loan.currency || 'ETB';

  const getStatusColor = (status: LoanDetails['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'overdue':
        return 'text-red-600 bg-red-50';
      case 'completed':
        return 'text-blue-600 bg-blue-50';
      case 'defaulted':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('am-ET', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <Card className={`shadow-md hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Loan #{loan.loanId}</h3>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              loan.status
            )}`}
            role="status"
            aria-label={`Loan status: ${loan.status}`}
          >
            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
          </span>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-xl font-bold">{formatCurrency(loan.totalAmount)}</p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5" role="progressbar" aria-valuenow={progressPercentage} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatCurrency(loan.paidAmount)} paid</span>
            <span>{formatCurrency(loan.remainingAmount)} remaining</span>
          </div>
        </div>

        {/* Installments Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Installments</p>
            <p className="font-medium">
              {loan.installmentsPaid} of {loan.totalInstallments}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Next Payment</p>
            <p className="font-medium">{new Date(loan.nextPaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            <p className="text-sm text-gray-600">{formatCurrency(loan.nextPaymentAmount)}</p>
          </div>
        </div>

        {/* Action Buttons */}
        {(onViewDetails || onMakePayment) && (
          <div className="flex gap-2 pt-2">
            {onMakePayment && loan.status !== 'completed' && (
              <button
                onClick={onMakePayment}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                aria-label={`Make payment for loan ${loan.loanId}`}
              >
                Make Payment
              </button>
            )}
            {onViewDetails && (
              <button
                onClick={onViewDetails}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                aria-label={`View details for loan ${loan.loanId}`}
              >
                View Details
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};