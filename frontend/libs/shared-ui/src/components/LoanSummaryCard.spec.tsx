import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { LoanSummaryCard, LoanDetails } from './LoanSummaryCard';

describe('LoanSummaryCard', () => {
  const mockLoan: LoanDetails = {
    loanId: 'LN-2024-001',
    principalAmount: 10000,
    totalAmount: 11200,
    paidAmount: 3360,
    remainingAmount: 7840,
    nextPaymentDate: '2024-02-15',
    nextPaymentAmount: 1120,
    installmentsPaid: 3,
    totalInstallments: 10,
    status: 'active',
    currency: 'ETB',
  };

  const mockHandlers = {
    onViewDetails: vi.fn(),
    onMakePayment: vi.fn(),
  };

  describe('Functionality', () => {
    it('renders loan information correctly', () => {
      render(<LoanSummaryCard loan={mockLoan} {...mockHandlers} />);

      expect(screen.getByText('Loan #LN-2024-001')).toBeInTheDocument();
      expect(screen.getByText('Total Amount')).toBeInTheDocument();
      expect(screen.getByText('3 of 10')).toBeInTheDocument();
    });

    it('displays correct status badge', () => {
      render(<LoanSummaryCard loan={mockLoan} />);

      const statusBadge = screen.getByRole('status');
      expect(statusBadge).toHaveTextContent('Active');
      expect(statusBadge).toHaveClass('text-green-600');
    });

    it('shows correct progress percentage', () => {
      render(<LoanSummaryCard loan={mockLoan} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '30');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('calls action handlers when buttons are clicked', () => {
      const handlers = {
        onViewDetails: vi.fn(),
        onMakePayment: vi.fn(),
      };
      render(<LoanSummaryCard loan={mockLoan} {...handlers} />);

      fireEvent.click(screen.getByText('Make Payment'));
      expect(handlers.onMakePayment).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('View Details'));
      expect(handlers.onViewDetails).toHaveBeenCalledTimes(1);
    });

    it('hides make payment button for completed loans', () => {
      const completedLoan = { ...mockLoan, status: 'completed' as const };
      render(<LoanSummaryCard loan={completedLoan} {...mockHandlers} />);

      expect(screen.queryByText('Make Payment')).not.toBeInTheDocument();
      expect(screen.getByText('View Details')).toBeInTheDocument();
    });

    it('formats currency correctly for Ethiopian Birr', () => {
      render(<LoanSummaryCard loan={mockLoan} />);

      // Check that currency is formatted
      const totalAmount = screen.getByText(/ETB/);
      expect(totalAmount).toBeInTheDocument();
    });
  });

  describe('Accessibility - WCAG 2.1 AAA Compliance', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<LoanSummaryCard loan={mockLoan} {...mockHandlers} />);
      const results = await axe(container, {
        rules: {
          'color-contrast-enhanced': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labels for interactive elements', () => {
      render(<LoanSummaryCard loan={mockLoan} {...mockHandlers} />);

      const makePaymentBtn = screen.getByRole('button', { name: /make payment for loan LN-2024-001/i });
      expect(makePaymentBtn).toBeInTheDocument();

      const viewDetailsBtn = screen.getByRole('button', { name: /view details for loan LN-2024-001/i });
      expect(viewDetailsBtn).toBeInTheDocument();
    });

    it('has accessible status indicator', () => {
      render(<LoanSummaryCard loan={mockLoan} />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Loan status: active');
    });

    it('provides accessible progress bar', () => {
      render(<LoanSummaryCard loan={mockLoan} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '30');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('maintains proper heading hierarchy', () => {
      render(<LoanSummaryCard loan={mockLoan} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Loan #LN-2024-001');
    });

    it('supports keyboard navigation for all interactive elements', () => {
      render(<LoanSummaryCard loan={mockLoan} {...mockHandlers} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        button.focus();
        expect(document.activeElement).toBe(button);
      });
    });

    it('has sufficient color contrast for all status types', async () => {
      const statuses: LoanDetails['status'][] = ['active', 'overdue', 'completed', 'defaulted'];
      
      for (const status of statuses) {
        const { container } = render(
          <LoanSummaryCard loan={{ ...mockLoan, status }} />
        );
        
        const results = await axe(container, {
          rules: {
            'color-contrast-enhanced': { enabled: true },
          },
        });
        
        expect(results).toHaveNoViolations();
      }
    });

    it('provides clear focus indicators', () => {
      render(<LoanSummaryCard loan={mockLoan} {...mockHandlers} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
      });
    });

    it('announces important information to screen readers', () => {
      render(<LoanSummaryCard loan={mockLoan} />);

      // Check that critical information is accessible
      expect(screen.getByText('Total Amount')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('Installments')).toBeInTheDocument();
      expect(screen.getByText('Next Payment')).toBeInTheDocument();
    });

    it('handles different viewport sizes accessibly', async () => {
      const { container, rerender } = render(
        <div style={{ width: '320px' }}>
          <LoanSummaryCard loan={mockLoan} {...mockHandlers} />
        </div>
      );

      let results = await axe(container);
      expect(results).toHaveNoViolations();

      // Test larger viewport
      rerender(
        <div style={{ width: '1024px' }}>
          <LoanSummaryCard loan={mockLoan} {...mockHandlers} />
        </div>
      );

      results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});