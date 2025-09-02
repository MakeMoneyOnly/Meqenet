import React from 'react';

export interface PaymentMethod {
  id: string;
  type: 'telebirr' | 'cbe_birr' | 'hellocash' | 'santimpay' | 'arifpay' | 'chapa' | 'bank_transfer' | 'card';
  name: string;
  description?: string;
  icon?: string;
  isDefault?: boolean;
  lastFourDigits?: string;
  expiryDate?: string;
  balance?: number;
  currency?: string;
  isAvailable?: boolean;
  processingFee?: number;
  estimatedTime?: string;
}

export interface PaymentMethodSelectorProps {
  methods: PaymentMethod[];
  selectedMethodId?: string;
  onSelect: (methodId: string) => void;
  showBalance?: boolean;
  showFees?: boolean;
  className?: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  methods,
  selectedMethodId,
  onSelect,
  showBalance = false,
  showFees = false,
  className = '',
}) => {
  const formatCurrency = (amount: number, currency = 'ETB') => {
    return new Intl.NumberFormat('am-ET', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getMethodIcon = (type: PaymentMethod['type']) => {
    // These would typically be actual icon components or images
    const icons = {
      telebirr: '📱',
      cbe_birr: '🏦',
      hellocash: '💵',
      santimpay: '💳',
      arifpay: '💰',
      chapa: '🔐',
      bank_transfer: '🏛️',
      card: '💳',
    };
    return icons[type] || '💰';
  };

  const getMethodColor = (type: PaymentMethod['type']) => {
    const colors = {
      telebirr: 'border-green-500',
      cbe_birr: 'border-blue-500',
      hellocash: 'border-yellow-500',
      santimpay: 'border-purple-500',
      arifpay: 'border-indigo-500',
      chapa: 'border-pink-500',
      bank_transfer: 'border-gray-500',
      card: 'border-red-500',
    };
    return colors[type] || 'border-gray-400';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <fieldset>
        <legend className="sr-only">Select a payment method</legend>
        {methods.map((method) => {
          const isSelected = selectedMethodId === method.id;
          const isDisabled = method.isAvailable === false;
          
          return (
            <div
              key={method.id}
              className={`relative border rounded-lg p-4 mb-3 cursor-pointer transition-all ${
                isSelected
                  ? `${getMethodColor(method.type)} border-2 bg-blue-50`
                  : 'border-gray-300 hover:border-gray-400'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isDisabled && onSelect(method.id)}
              onKeyDown={(e) => {
                if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSelect(method.id);
                }
              }}
              tabIndex={isDisabled ? -1 : 0}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={isDisabled}
              aria-label={`Payment method: ${method.name}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {/* Radio button */}
                  <div
                    className={`flex items-center justify-center w-5 h-5 border-2 rounded-full mr-3 ${
                      isSelected
                        ? 'border-blue-600'
                        : 'border-gray-400'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                    )}
                  </div>

                  {/* Method icon */}
                  <span className="text-2xl mr-3" aria-hidden="true">
                    {getMethodIcon(method.type)}
                  </span>

                  {/* Method details */}
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-sm font-medium text-gray-900">
                        {method.name}
                      </h4>
                      {method.isDefault && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    
                    {method.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {method.description}
                      </p>
                    )}
                    
                    {method.lastFourDigits && (
                      <p className="text-xs text-gray-600 mt-1">
                        •••• {method.lastFourDigits}
                        {method.expiryDate && ` | Exp: ${method.expiryDate}`}
                      </p>
                    )}

                    {/* Additional info */}
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      {showBalance && method.balance !== undefined && (
                        <span className="text-gray-600">
                          Balance: <span className="font-medium text-gray-900">
                            {formatCurrency(method.balance, method.currency)}
                          </span>
                        </span>
                      )}
                      
                      {showFees && method.processingFee !== undefined && (
                        <span className="text-gray-600">
                          Fee: <span className="font-medium text-gray-900">
                            {method.processingFee === 0 
                              ? 'Free' 
                              : formatCurrency(method.processingFee, method.currency)}
                          </span>
                        </span>
                      )}
                      
                      {method.estimatedTime && (
                        <span className="text-gray-600">
                          Time: <span className="font-medium text-gray-900">
                            {method.estimatedTime}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Availability indicator */}
                {method.isAvailable === false && (
                  <span className="absolute top-2 right-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                    Unavailable
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </fieldset>

      {/* Information box */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-gray-400"
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
            <p className="text-xs text-gray-600">
              All payment methods are secure and encrypted. Processing times may vary based on the selected method.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};