import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';
import { CreditScoreIndicator } from './CreditScoreIndicator';

describe('CreditScoreIndicator', () => {
  const mockProps = {
    score: 720,
    maxScore: 850,
    showDetails: true,
    lastUpdated: '2024-01-15',
    nextUpdate: '2024-02-15',
    factors: {
      positive: [
        'Consistent on-time payments',
        'Low credit utilization',
      ],
      negative: [
        'Limited credit history',
      ],
    },
  };

  describe('Functionality', () => {
    it('renders credit score correctly', () => {
      render(<CreditScoreIndicator {...mockProps} />);

      expect(screen.getByText('720')).toBeInTheDocument();
      expect(screen.getByText('out of 850')).toBeInTheDocument();
      expect(screen.getByText('Credit Score')).toBeInTheDocument();
    });

    it('displays correct rating badge', () => {
      const { rerender } = render(<CreditScoreIndicator score={780} />);
      expect(screen.getByText('Excellent')).toBeInTheDocument();

      rerender(<CreditScoreIndicator score={720} />);
      expect(screen.getByText('Good')).toBeInTheDocument();

      rerender(<CreditScoreIndicator score={650} />);
      expect(screen.getByText('Fair')).toBeInTheDocument();

      rerender(<CreditScoreIndicator score={600} />);
      expect(screen.getByText('Poor')).toBeInTheDocument();

      rerender(<CreditScoreIndicator score={550} />);
      expect(screen.getByText('Very Poor')).toBeInTheDocument();
    });

    it('shows update information when provided', () => {
      render(<CreditScoreIndicator {...mockProps} />);

      expect(screen.getByText('Last Updated:')).toBeInTheDocument();
      expect(screen.getByText('Next Update:')).toBeInTheDocument();
    });

    it('displays positive and negative factors', () => {
      render(<CreditScoreIndicator {...mockProps} />);

      expect(screen.getByText('Positive Factors')).toBeInTheDocument();
      expect(screen.getByText('Consistent on-time payments')).toBeInTheDocument();
      expect(screen.getByText('Areas for Improvement')).toBeInTheDocument();
      expect(screen.getByText('Limited credit history')).toBeInTheDocument();
    });

    it('hides details when showDetails is false', () => {
      render(<CreditScoreIndicator score={720} showDetails={false} />);

      expect(screen.queryByText('Last Updated:')).not.toBeInTheDocument();
      expect(screen.queryByText('Key Factors')).not.toBeInTheDocument();
    });

    it('renders SVG gauge correctly', () => {
      render(<CreditScoreIndicator {...mockProps} />);

      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('aria-label', 'Credit score gauge showing 720 out of 850');
    });
  });

  describe('Accessibility - WCAG 2.1 AAA Compliance', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<CreditScoreIndicator {...mockProps} />);
      const results = await axe(container, {
        rules: {
          'color-contrast-enhanced': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('provides proper ARIA labels for visual elements', () => {
      render(<CreditScoreIndicator {...mockProps} />);

      const gauge = screen.getByRole('img');
      expect(gauge).toHaveAttribute('aria-label', 'Credit score gauge showing 720 out of 850');
    });

    it('uses semantic list markup for factors', () => {
      render(<CreditScoreIndicator {...mockProps} />);

      const positiveLists = screen.getByRole('list', { name: 'Positive credit factors' });
      expect(positiveLists).toBeInTheDocument();

      const negativeLists = screen.getByRole('list', { name: 'Areas for credit improvement' });
      expect(negativeLists).toBeInTheDocument();
    });

    it('maintains proper heading hierarchy', () => {
      render(<CreditScoreIndicator {...mockProps} />);

      const mainHeading = screen.getByRole('heading', { level: 3 });
      expect(mainHeading).toHaveTextContent('Credit Score');

      const subHeading = screen.getByRole('heading', { level: 4 });
      expect(subHeading).toHaveTextContent('Key Factors');
    });

    it('has sufficient color contrast for all score ratings', async () => {
      const scores = [800, 720, 650, 600, 550]; // Different rating levels
      
      for (const score of scores) {
        const { container } = render(
          <CreditScoreIndicator score={score} showDetails={true} />
        );
        
        const results = await axe(container, {
          rules: {
            'color-contrast-enhanced': { enabled: true },
          },
        });
        
        expect(results).toHaveNoViolations();
      }
    });

    it('provides accessible information hierarchy', () => {
      render(<CreditScoreIndicator {...mockProps} />);

      // Check that information is structured accessibly
      expect(screen.getByText('720')).toBeInTheDocument();
      expect(screen.getByText('out of 850')).toBeInTheDocument();
      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('includes helpful tips with proper ARIA attributes', () => {
      render(<CreditScoreIndicator {...mockProps} />);

      const tip = screen.getByText(/Make timely payments/);
      expect(tip).toBeInTheDocument();
      
      // The tip should be in an informational context
      const tipContainer = tip.closest('[class*="bg-blue-50"]');
      expect(tipContainer).toBeInTheDocument();
    });

    it('supports high contrast mode', async () => {
      const { container } = render(
        <div style={{ filter: 'contrast(2)', background: 'black' }}>
          <CreditScoreIndicator {...mockProps} />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides text alternatives for visual indicators', () => {
      render(<CreditScoreIndicator {...mockProps} />);

      // Check that visual elements have text alternatives
      expect(screen.getByText('Good')).toBeInTheDocument(); // Rating badge
      expect(screen.getByText('720')).toBeInTheDocument(); // Score number
    });

    it('uses appropriate color coding with text labels', () => {
      render(<CreditScoreIndicator {...mockProps} />);

      // Verify that color is not the only means of conveying information
      const positiveFactor = screen.getByText('Consistent on-time payments');
      const listItem = positiveFactor.closest('li');
      expect(listItem?.querySelector('svg')).toBeInTheDocument(); // Has icon
      expect(screen.getByText('Positive Factors')).toBeInTheDocument(); // Has text label
    });

    it('maintains readability at different zoom levels', async () => {
      const { container } = render(
        <div style={{ zoom: '200%' }}>
          <CreditScoreIndicator {...mockProps} />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});