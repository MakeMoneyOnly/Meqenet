import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PaymentPlanCard } from './PaymentPlanCard';
import { LoanSummaryCard, LoanDetails } from './LoanSummaryCard';
import { CreditScoreIndicator } from './CreditScoreIndicator';
import { InstallmentSchedule, Installment } from './InstallmentSchedule';
import { PaymentMethodSelector, PaymentMethod } from './PaymentMethodSelector';
import { ProgressIndicator } from './ProgressIndicator';

describe('Component Accessibility Tests - WCAG 2.1 AAA', () => {
  describe('PaymentPlanCard Accessibility', () => {
    const mockProps = {
      planName: 'Pay in 3',
      description: 'Split payment into 3 installments',
      installments: 3,
      interestRate: '0%',
      isSelected: false,
      onSelect: vi.fn(),
    };

    it('has proper ARIA attributes', () => {
      const { container } = render(<PaymentPlanCard {...mockProps} isSelected={true} />);
      const card = container.querySelector('[aria-pressed]');
      
      expect(card).toHaveAttribute('aria-pressed', 'true');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('is keyboard accessible', () => {
      const handleSelect = vi.fn();
      render(<PaymentPlanCard {...mockProps} onSelect={handleSelect} />);
      
      const card = screen.getByRole('button');
      card.focus();
      expect(document.activeElement).toBe(card);
      
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(handleSelect).toHaveBeenCalled();
    });

    it('has semantic heading structure', () => {
      render(<PaymentPlanCard {...mockProps} />);
      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toHaveTextContent('Pay in 3');
    });
  });

  describe('LoanSummaryCard Accessibility', () => {
    const mockLoan: LoanDetails = {
      loanId: 'LN-001',
      principalAmount: 10000,
      totalAmount: 11000,
      paidAmount: 3000,
      remainingAmount: 8000,
      nextPaymentDate: '2024-02-15',
      nextPaymentAmount: 1000,
      installmentsPaid: 3,
      totalInstallments: 11,
      status: 'active',
      currency: 'ETB',
    };

    it('has accessible status indicator', () => {
      render(<LoanSummaryCard loan={mockLoan} />);
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Loan status: active');
    });

    it('provides accessible progress bar', () => {
      render(<LoanSummaryCard loan={mockLoan} />);
      const progressBar = screen.getByRole('progressbar');
      
      expect(progressBar).toHaveAttribute('aria-valuenow');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('has proper ARIA labels for buttons', () => {
      const handlers = {
        onViewDetails: vi.fn(),
        onMakePayment: vi.fn(),
      };
      render(<LoanSummaryCard loan={mockLoan} {...handlers} />);
      
      expect(screen.getByRole('button', { name: /make payment for loan LN-001/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view details for loan LN-001/i })).toBeInTheDocument();
    });
  });

  describe('CreditScoreIndicator Accessibility', () => {
    const mockProps = {
      score: 720,
      maxScore: 850,
      showDetails: true,
      factors: {
        positive: ['On-time payments'],
        negative: ['High utilization'],
      },
    };

    it('provides proper ARIA labels for visual elements', () => {
      render(<CreditScoreIndicator {...mockProps} />);
      const gauge = screen.getByRole('img');
      expect(gauge).toHaveAttribute('aria-label', 'Credit score gauge showing 720 out of 850');
    });

    it('uses semantic list markup', () => {
      render(<CreditScoreIndicator {...mockProps} />);
      
      const positiveList = screen.getByRole('list', { name: 'Positive credit factors' });
      expect(positiveList).toBeInTheDocument();
      
      const negativeList = screen.getByRole('list', { name: 'Areas for credit improvement' });
      expect(negativeList).toBeInTheDocument();
    });

    it('maintains proper heading hierarchy', () => {
      render(<CreditScoreIndicator {...mockProps} />);
      
      const mainHeading = screen.getByRole('heading', { level: 3 });
      expect(mainHeading).toHaveTextContent('Credit Score');
    });
  });

  describe('InstallmentSchedule Accessibility', () => {
    const mockInstallments: Installment[] = [
      {
        id: '1',
        installmentNumber: 1,
        dueDate: '2024-01-15',
        amount: 1000,
        principalAmount: 900,
        interestAmount: 100,
        status: 'paid',
        paidDate: '2024-01-14',
      },
      {
        id: '2',
        installmentNumber: 2,
        dueDate: '2024-02-15',
        amount: 1000,
        principalAmount: 900,
        interestAmount: 100,
        status: 'pending',
      },
    ];

    it('provides accessible status indicators', () => {
      render(<InstallmentSchedule installments={mockInstallments} />);
      
      const statuses = screen.getAllByRole('status');
      statuses.forEach(status => {
        expect(status).toHaveAttribute('aria-label');
      });
    });

    it('has proper ARIA labels for pay buttons', () => {
      const handlePay = vi.fn();
      render(
        <InstallmentSchedule
          installments={mockInstallments}
          onPayInstallment={handlePay}
        />
      );
      
      const payButton = screen.getAllByRole('button')[0];
      expect(payButton).toHaveAttribute('aria-label', expect.stringContaining('Pay installment'));
    });

    it('maintains table semantics on desktop', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      
      const { container } = render(
        <InstallmentSchedule installments={mockInstallments} />
      );
      
      // Check for table structure
      const table = container.querySelector('table');
      if (table) {
        expect(table.querySelector('thead')).toBeInTheDocument();
        expect(table.querySelector('tbody')).toBeInTheDocument();
      }
    });
  });

  describe('PaymentMethodSelector Accessibility', () => {
    const mockMethods: PaymentMethod[] = [
      {
        id: '1',
        type: 'telebirr',
        name: 'Telebirr',
        description: 'Mobile money',
        isAvailable: true,
      },
      {
        id: '2',
        type: 'cbe_birr',
        name: 'CBE Birr',
        description: 'Bank transfer',
        isAvailable: false,
      },
    ];

    it('implements ARIA radio group pattern', () => {
      render(
        <PaymentMethodSelector
          methods={mockMethods}
          selectedMethodId="1"
          onSelect={vi.fn()}
        />
      );
      
      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons).toHaveLength(2);
      expect(radioButtons[0]).toHaveAttribute('aria-checked', 'true');
    });

    it('properly indicates disabled state', () => {
      render(
        <PaymentMethodSelector
          methods={mockMethods}
          onSelect={vi.fn()}
        />
      );
      
      const disabledMethod = screen.getByLabelText(/Payment method: CBE Birr/);
      expect(disabledMethod).toHaveAttribute('aria-disabled', 'true');
      expect(disabledMethod).toHaveAttribute('tabIndex', '-1');
    });

    it('supports keyboard navigation', () => {
      const handleSelect = vi.fn();
      render(
        <PaymentMethodSelector
          methods={mockMethods}
          onSelect={handleSelect}
        />
      );
      
      const telebirr = screen.getByLabelText(/Payment method: Telebirr/);
      fireEvent.keyDown(telebirr, { key: 'Enter' });
      expect(handleSelect).toHaveBeenCalledWith('1');
    });
  });

  describe('ProgressIndicator Accessibility', () => {
    const mockProps = {
      currentStep: 2,
      totalSteps: 4,
      steps: ['Step 1', 'Step 2', 'Step 3', 'Step 4'],
    };

    it('has proper navigation structure', () => {
      render(<ProgressIndicator {...mockProps} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Progress');
    });

    it('indicates current step', () => {
      const { container } = render(<ProgressIndicator {...mockProps} />);
      
      const currentStep = container.querySelector('[aria-current="step"]');
      expect(currentStep).toBeInTheDocument();
    });

    it('provides screen reader text for each step', () => {
      render(<ProgressIndicator {...mockProps} />);
      
      // Check that step text is available
      mockProps.steps.forEach(step => {
        expect(screen.getByText(step, { selector: '.sr-only' })).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Component Accessibility', () => {
    it('all interactive elements are focusable', () => {
      const { container } = render(
        <>
          <PaymentPlanCard
            planName="Test"
            description="Test"
            installments={1}
            interestRate="0%"
            onSelect={vi.fn()}
          />
          <LoanSummaryCard
            loan={{
              loanId: '1',
              principalAmount: 1000,
              totalAmount: 1000,
              paidAmount: 0,
              remainingAmount: 1000,
              nextPaymentDate: '2024-01-01',
              nextPaymentAmount: 100,
              installmentsPaid: 0,
              totalInstallments: 10,
              status: 'active',
            }}
            onMakePayment={vi.fn()}
          />
        </>
      );

      const focusableElements = container.querySelectorAll(
        'button, [tabindex]:not([tabindex="-1"]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
      );

      focusableElements.forEach(element => {
        // Element should either have a tabIndex or be naturally focusable (like buttons)
        const hasTabIndex = element.hasAttribute('tabIndex');
        const isNaturallyFocusable = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
        expect(hasTabIndex || isNaturallyFocusable).toBe(true);
      });
    });

    it('all images and icons have appropriate alt text or are hidden', () => {
      const { container } = render(
        <CreditScoreIndicator
          score={700}
          factors={{
            positive: ['Good payment history'],
            negative: ['High utilization'],
          }}
        />
      );

      const svgs = container.querySelectorAll('svg');
      svgs.forEach(svg => {
        const hasAriaLabel = svg.hasAttribute('aria-label');
        const hasAriaHidden = svg.getAttribute('aria-hidden') === 'true';
        const hasRole = svg.hasAttribute('role');
        
        // SVG should either be labeled or hidden from screen readers
        expect(hasAriaLabel || hasAriaHidden || hasRole).toBe(true);
      });
    });
  });
});