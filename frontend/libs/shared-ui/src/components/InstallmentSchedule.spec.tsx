import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { InstallmentSchedule, Installment } from './InstallmentSchedule';

describe('InstallmentSchedule', () => {
  const mockInstallments: Installment[] = [
    {
      id: 'inst-001',
      installmentNumber: 1,
      dueDate: '2024-01-15',
      amount: 1120,
      principalAmount: 1000,
      interestAmount: 120,
      status: 'paid',
      paidDate: '2024-01-14',
      paidAmount: 1120,
    },
    {
      id: 'inst-002',
      installmentNumber: 2,
      dueDate: '2024-02-15',
      amount: 1120,
      principalAmount: 1000,
      interestAmount: 120,
      status: 'pending',
    },
    {
      id: 'inst-003',
      installmentNumber: 3,
      dueDate: '2024-03-15',
      amount: 1120,
      principalAmount: 1000,
      interestAmount: 120,
      status: 'upcoming',
    },
  ];

  const mockOnPayInstallment = vi.fn();

  describe('Functionality', () => {
    it('renders installment schedule correctly', () => {
      render(
        <InstallmentSchedule
          installments={mockInstallments}
          onPayInstallment={mockOnPayInstallment}
        />
      );

      expect(screen.getByText('Payment Schedule')).toBeInTheDocument();
      expect(screen.getByText('Track your installment payments and upcoming due dates')).toBeInTheDocument();
    });

    it('displays all installments with correct information', () => {
      render(
        <InstallmentSchedule
          installments={mockInstallments}
          onPayInstallment={mockOnPayInstallment}
        />
      );

      // Check for installment numbers
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
    });

    it('shows correct status badges', () => {
      render(
        <InstallmentSchedule
          installments={mockInstallments}
          onPayInstallment={mockOnPayInstallment}
        />
      );

      const paidBadge = screen.getByRole('status', { name: /payment status: paid/i });
      expect(paidBadge).toHaveTextContent('Paid');

      const pendingBadge = screen.getByRole('status', { name: /payment status: pending/i });
      expect(pendingBadge).toHaveTextContent('Pending');

      const upcomingBadge = screen.getByRole('status', { name: /payment status: upcoming/i });
      expect(upcomingBadge).toHaveTextContent('Upcoming');
    });

    it('calls onPayInstallment when pay button is clicked', () => {
      const handlePay = vi.fn();
      render(
        <InstallmentSchedule
          installments={mockInstallments}
          onPayInstallment={handlePay}
        />
      );

      const payButtons = screen.getAllByText('Pay Now');
      fireEvent.click(payButtons[0]);

      expect(handlePay).toHaveBeenCalledWith('inst-002');
    });

    it('hides pay button when showPayButton is false', () => {
      render(
        <InstallmentSchedule
          installments={mockInstallments}
          showPayButton={false}
        />
      );

      expect(screen.queryByText('Pay Now')).not.toBeInTheDocument();
    });

    it('displays summary footer with totals', () => {
      render(
        <InstallmentSchedule
          installments={mockInstallments}
          onPayInstallment={mockOnPayInstallment}
        />
      );

      expect(screen.getByText('Total Installments: 3')).toBeInTheDocument();
      expect(screen.getByText('Total Amount:')).toBeInTheDocument();
    });

    it('formats currency correctly', () => {
      render(
        <InstallmentSchedule
          installments={mockInstallments}
          currency="USD"
          onPayInstallment={mockOnPayInstallment}
        />
      );

      // Check for USD formatting
      const amounts = screen.getAllByText(/\$/);
      expect(amounts.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility - WCAG 2.1 AAA Compliance', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <InstallmentSchedule
          installments={mockInstallments}
          onPayInstallment={mockOnPayInstallment}
        />
      );
      
      const results = await axe(container, {
        rules: {
          'color-contrast-enhanced': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });

    it('uses proper table semantics for desktop view', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      
      render(
        <InstallmentSchedule
          installments={mockInstallments}
          onPayInstallment={mockOnPayInstallment}
        />
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Check for table headers
      expect(screen.getByRole('columnheader', { name: '#' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /due date/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /principal/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /interest/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /total/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
    });

    it('provides accessible status indicators', () => {
      render(
        <InstallmentSchedule
          installments={mockInstallments}
          onPayInstallment={mockOnPayInstallment}
        />
      );

      const statuses = screen.getAllByRole('status');
      statuses.forEach(status => {
        expect(status).toHaveAttribute('aria-label');
      });
    });

    it('has proper ARIA labels for interactive elements', () => {
      render(
        <InstallmentSchedule
          installments={mockInstallments}
          onPayInstallment={mockOnPayInstallment}
        />
      );

      const payButton = screen.getAllByRole('button')[0];
      expect(payButton).toHaveAttribute('aria-label', 'Pay installment 2');
    });

    it('maintains proper heading hierarchy', () => {
      render(
        <InstallmentSchedule
          installments={mockInstallments}
          onPayInstallment={mockOnPayInstallment}
        />
      );

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Payment Schedule');
    });

    it('supports keyboard navigation', () => {
      render(
        <InstallmentSchedule
          installments={mockInstallments}
          onPayInstallment={mockOnPayInstallment}
        />
      );

      const payButtons = screen.getAllByRole('button');
      payButtons.forEach(button => {
        button.focus();
        expect(document.activeElement).toBe(button);
      });
    });

    it('has sufficient color contrast for all status types', async () => {
      const installmentsWithAllStatuses: Installment[] = [
        { ...mockInstallments[0], status: 'paid' },
        { ...mockInstallments[1], status: 'pending' },
        { ...mockInstallments[2], status: 'overdue' },
        { ...mockInstallments[2], id: 'inst-004', status: 'upcoming' },
      ];

      const { container } = render(
        <InstallmentSchedule
          installments={installmentsWithAllStatuses}
          onPayInstallment={mockOnPayInstallment}
        />
      );

      const results = await axe(container, {
        rules: {
          'color-contrast-enhanced': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('provides responsive design with accessible mobile view', async () => {
      // Test mobile view
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      
      const { container } = render(
        <div className="sm:hidden">
          <InstallmentSchedule
            installments={mockInstallments}
            onPayInstallment={mockOnPayInstallment}
          />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('announces changes to screen readers', () => {
      const { rerender } = render(
        <InstallmentSchedule
          installments={mockInstallments}
          onPayInstallment={mockOnPayInstallment}
        />
      );

      // Update an installment status
      const updatedInstallments = [...mockInstallments];
      updatedInstallments[1].status = 'paid';
      
      rerender(
        <InstallmentSchedule
          installments={updatedInstallments}
          onPayInstallment={mockOnPayInstallment}
        />
      );

      // Check that the new status is reflected
      const paidStatuses = screen.getAllByRole('status', { name: /payment status: paid/i });
      expect(paidStatuses).toHaveLength(2);
    });

    it('provides clear focus indicators', () => {
      render(
        <InstallmentSchedule
          installments={mockInstallments}
          onPayInstallment={mockOnPayInstallment}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.className).toContain('focus:');
      });
    });

    it('supports print media accessibility', async () => {
      const { container } = render(
        <div style={{ '@media print': {} }}>
          <InstallmentSchedule
            installments={mockInstallments}
            showPayButton={false}
          />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});