import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface FeeRange {
  min: number;
  max: number;
  fixedFee: number;
  percentageFee: number;
}

/**
 * Service to calculate transaction fees based on transaction amount
 */
@Injectable()
export class TransactionFeeService {
  private readonly logger = new Logger(TransactionFeeService.name);
  private readonly feeRanges: FeeRange[];

  constructor(private readonly configService: ConfigService) {
    // Check if transaction fees are enabled
    const feesEnabled = this.configService.get<boolean>('TRANSACTION_FEE_ENABLED', true);

    if (!feesEnabled) {
      this.logger.log('Transaction fees are disabled in configuration');
      this.feeRanges = [];
      return;
    }

    // Try to load fee ranges from config
    try {
      const configFeeRanges = this.configService.get<string>('TRANSACTION_FEE_CONFIG');

      if (configFeeRanges) {
        this.feeRanges = JSON.parse(configFeeRanges);
        this.logger.log(`Loaded ${this.feeRanges.length} transaction fee ranges from configuration`);
      } else {
        // Default fee structure if not configured
        this.feeRanges = [
          { min: 0, max: 1000, fixedFee: 10, percentageFee: 0.01 },       // 10 ETB + 1% for transactions up to 1,000 ETB
          { min: 1000, max: 5000, fixedFee: 20, percentageFee: 0.008 },   // 20 ETB + 0.8% for transactions 1,000-5,000 ETB
          { min: 5000, max: 10000, fixedFee: 30, percentageFee: 0.006 },  // 30 ETB + 0.6% for transactions 5,000-10,000 ETB
          { min: 10000, max: 50000, fixedFee: 50, percentageFee: 0.005 }, // 50 ETB + 0.5% for transactions 10,000-50,000 ETB
          { min: 50000, max: Infinity, fixedFee: 100, percentageFee: 0.004 }, // 100 ETB + 0.4% for transactions above 50,000 ETB
        ];
        this.logger.log('Using default transaction fee ranges');
      }
    } catch (error) {
      this.logger.error(`Error parsing transaction fee configuration: ${error.message}`);
      // Default fee structure if parsing fails
      this.feeRanges = [
        { min: 0, max: 1000, fixedFee: 10, percentageFee: 0.01 },
        { min: 1000, max: 5000, fixedFee: 20, percentageFee: 0.008 },
        { min: 5000, max: 10000, fixedFee: 30, percentageFee: 0.006 },
        { min: 10000, max: 50000, fixedFee: 50, percentageFee: 0.005 },
        { min: 50000, max: Infinity, fixedFee: 100, percentageFee: 0.004 },
      ];
    }
  }

  /**
   * Calculate transaction fee based on transaction amount
   * @param amount Transaction amount in ETB
   * @returns Object containing fee details
   */
  calculateFee(amount: number): {
    fee: number;
    feeBreakdown: {
      fixedFee: number;
      percentageFee: number;
      percentageAmount: number;
    };
    totalWithFee: number;
  } {
    // Check if transaction fees are enabled globally
    const feesEnabled = this.configService.get<boolean>('TRANSACTION_FEE_ENABLED', true);

    // If fees are disabled or no fee ranges are defined, return zero fee
    if (!feesEnabled || this.feeRanges.length === 0) {
      this.logger.log(`Transaction fees are disabled, no fee applied for amount ${amount} ETB`);
      return {
        fee: 0,
        feeBreakdown: {
          fixedFee: 0,
          percentageFee: 0,
          percentageAmount: 0,
        },
        totalWithFee: amount,
      };
    }

    // Find the appropriate fee range
    const range = this.feeRanges.find(range => amount >= range.min && amount < range.max);

    if (!range) {
      this.logger.warn(`No fee range found for amount ${amount}, using default minimum fee`);
      // Default to minimum fee if no range found
      return {
        fee: 10,
        feeBreakdown: {
          fixedFee: 10,
          percentageFee: 0,
          percentageAmount: 0,
        },
        totalWithFee: amount + 10,
      };
    }

    // Calculate percentage component
    const percentageAmount = amount * range.percentageFee;

    // Calculate total fee
    const totalFee = range.fixedFee + percentageAmount;

    // Round fee to nearest ETB (or can be configured to round differently)
    const roundedFee = Math.ceil(totalFee);

    this.logger.log(`Calculated fee for amount ${amount} ETB: ${roundedFee} ETB (${range.fixedFee} fixed + ${range.percentageFee * 100}%)`);

    return {
      fee: roundedFee,
      feeBreakdown: {
        fixedFee: range.fixedFee,
        percentageFee: range.percentageFee,
        percentageAmount,
      },
      totalWithFee: amount + roundedFee,
    };
  }
}
