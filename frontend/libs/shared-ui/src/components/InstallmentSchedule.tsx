import React from 'react';

export interface Installment {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  status: 'paid' | 'pending' | 'overdue' | 'upcoming';
  paidDate?: string;
  paidAmount?: number;
}

export interface InstallmentScheduleProps {
  installments: Installment[];
  currency?: string;
  onPayInstallment?: (installmentId: string) => void;
  className?: string;
  showPayButton?: boolean;
}

export const InstallmentSchedule: React.FC<InstallmentScheduleProps> = ({
  installments,
  currency = 'ETB',
  onPayInstallment,
  className = '',
  showPayButton = true,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('am-ET', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: Installment['status']) => {
    const statusStyles = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      upcoming: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}
        role="status"
        aria-label={`Payment status: ${status}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className={`bg-white shadow-sm rounded-lg overflow-hidden ${className}`}>
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Payment Schedule
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Track your installment payments and upcoming due dates
        </p>
      </div>

      {/* Mobile View */}
      <div className="sm:hidden">
        {installments.map((installment) => (
          <div
            key={installment.id}
            className="border-b border-gray-200 px-4 py-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">
                Installment #{installment.installmentNumber}
              </span>
              {getStatusBadge(installment.status)}
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Due Date:</span>
                <span>{formatDate(installment.dueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">{formatCurrency(installment.amount)}</span>
              </div>
              {installment.paidDate && (
                <div className="flex justify-between">
                  <span>Paid Date:</span>
                  <span>{formatDate(installment.paidDate)}</span>
                </div>
              )}
            </div>
            {showPayButton && installment.status === 'pending' && onPayInstallment && (
              <button
                onClick={() => onPayInstallment(installment.id)}
                className="mt-3 w-full bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={`Pay installment ${installment.installmentNumber}`}
              >
                Pay Now
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden sm:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                #
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Due Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Principal
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Interest
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Total
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              {showPayButton && onPayInstallment && (
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {installments.map((installment) => (
              <tr key={installment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {installment.installmentNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(installment.dueDate)}
                  {installment.paidDate && (
                    <span className="block text-xs text-gray-500">
                      Paid: {formatDate(installment.paidDate)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(installment.principalAmount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(installment.interestAmount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(installment.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(installment.status)}
                </td>
                {showPayButton && onPayInstallment && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {installment.status === 'pending' ? (
                      <button
                        onClick={() => onPayInstallment(installment.id)}
                        className="text-blue-600 hover:text-blue-900 font-medium focus:outline-none focus:underline"
                        aria-label={`Pay installment ${installment.installmentNumber}`}
                      >
                        Pay Now
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="bg-gray-50 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Total Installments: {installments.length}
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Total Amount: </span>
            <span className="font-medium text-gray-900">
              {formatCurrency(
                installments.reduce((sum, inst) => sum + inst.amount, 0)
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};