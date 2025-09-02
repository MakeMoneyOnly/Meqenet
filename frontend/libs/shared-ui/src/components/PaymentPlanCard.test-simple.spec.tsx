import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PaymentPlanCard } from './PaymentPlanCard';

describe('PaymentPlanCard - Simple Test', () => {
  it('renders without crashing', () => {
    const mockOnSelect = vi.fn();
    
    const { container } = render(
      <PaymentPlanCard
        planName="Test Plan"
        description="Test Description"
        installments={3}
        interestRate="0%"
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );
    
    expect(screen.getByText('Test Plan')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const mockOnSelect = vi.fn();
    
    const { container } = render(
      <PaymentPlanCard
        planName="Test Plan"
        description="Test Description"
        installments={3}
        interestRate="0%"
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );
    
    const card = container.querySelector('[role="button"]') || container.firstElementChild;
    if (card) {
      card.click();
      expect(mockOnSelect).toHaveBeenCalled();
    }
  });
});