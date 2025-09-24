import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  VirtualCard,
  VirtualCardStatus,
  PaymentMethodType,
} from '@prisma/client';
import { CreateVirtualCardDto } from '../dto/create-virtual-card.dto';
import { UpdateVirtualCardDto } from '../dto/update-virtual-card.dto';

@Injectable()
export class VirtualCardsService {
  private readonly logger = new Logger(VirtualCardsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a random card number
   * @returns A 16-digit card number
   */
  private generateCardNumber(): string {
    // Generate a 16-digit card number starting with 4 (like Visa)
    const prefix = '4';
    const randomDigits = Math.floor(Math.random() * 1000000000000000)
      .toString()
      .padStart(15, '0');
    return prefix + randomDigits.substring(1);
  }

  /**
   * Generate a random CVV
   * @returns A 3-digit CVV
   */
  private generateCVV(): string {
    return Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
  }

  /**
   * Generate expiry date (2 years from now)
   * @returns An object with month and year
   */
  private generateExpiryDate(): { month: number; year: number } {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 2);
    return {
      month: date.getMonth() + 1, // Month is 0-indexed
      year: date.getFullYear(),
    };
  }

  /**
   * Create a new virtual card for a user
   * @param userId User ID
   * @param createVirtualCardDto DTO for creating a virtual card
   * @returns The created virtual card
   */
  async create(
    userId: string,
    createVirtualCardDto: CreateVirtualCardDto
  ): Promise<VirtualCard> {
    this.logger.log(`Creating virtual card for user ${userId}`);

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Generate card details
    const cardNumber = this.generateCardNumber();
    const cvv = this.generateCVV();
    const { month, year } = this.generateExpiryDate();

    // Create a payment method first
    const paymentMethod = await this.prisma.paymentMethod.create({
      data: {
        userId,
        type: PaymentMethodType.VIRTUAL_CARD,
        provider: 'VIRTUAL',
        isDefault: createVirtualCardDto.isDefault || false,
        metadata: createVirtualCardDto.metadata,
      },
    });

    // Create the virtual card
    try {
      const virtualCard = await this.prisma.virtualCard.create({
        data: {
          userId,
          paymentMethodId: paymentMethod.id,
          cardNumber,
          cardHolderName: createVirtualCardDto.cardHolderName,
          expiryMonth: month,
          expiryYear: year,
          cvv,
          limitAmount: createVirtualCardDto.limitAmount,
          currency: createVirtualCardDto.currency || 'ETB',
          isDefault: createVirtualCardDto.isDefault || false,
          metadata: createVirtualCardDto.metadata,
        },
      });

      this.logger.log(`Virtual card created for user ${userId}`);
      return virtualCard;
    } catch (error) {
      // If virtual card creation fails, delete the payment method
      await this.prisma.paymentMethod.delete({
        where: { id: paymentMethod.id },
      });
      throw error;
    }
  }

  /**
   * Find all virtual cards for a user
   * @param userId User ID
   * @returns List of virtual cards
   */
  async findByUserId(userId: string): Promise<VirtualCard[]> {
    return this.prisma.virtualCard.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find a virtual card by ID
   * @param id Virtual card ID
   * @returns The virtual card
   */
  async findById(id: string): Promise<VirtualCard> {
    const virtualCard = await this.prisma.virtualCard.findUnique({
      where: { id },
    });

    if (!virtualCard) {
      throw new NotFoundException(`Virtual card with ID ${id} not found`);
    }

    return virtualCard;
  }

  /**
   * Update a virtual card
   * @param id Virtual card ID
   * @param updateVirtualCardDto DTO for updating a virtual card
   * @returns The updated virtual card
   */
  async update(
    id: string,
    updateVirtualCardDto: UpdateVirtualCardDto
  ): Promise<VirtualCard> {
    const virtualCard = await this.findById(id);

    // If setting as default, unset other cards as default
    if (updateVirtualCardDto.isDefault) {
      await this.prisma.virtualCard.updateMany({
        where: {
          userId: virtualCard.userId,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });

      // Also update the payment method
      await this.prisma.paymentMethod.update({
        where: { id: virtualCard.paymentMethodId },
        data: { isDefault: true },
      });
    }

    // Update the virtual card
    return this.prisma.virtualCard.update({
      where: { id },
      data: updateVirtualCardDto,
    });
  }

  /**
   * Delete a virtual card
   * @param id Virtual card ID
   * @returns The deleted virtual card
   */
  async delete(id: string): Promise<VirtualCard> {
    const virtualCard = await this.findById(id);

    // Delete the payment method first (will cascade to virtual card)
    await this.prisma.paymentMethod.delete({
      where: { id: virtualCard.paymentMethodId },
    });

    return virtualCard;
  }

  /**
   * Suspend a virtual card
   * @param id Virtual card ID
   * @returns The suspended virtual card
   */
  async suspend(id: string): Promise<VirtualCard> {
    return this.update(id, { status: VirtualCardStatus.SUSPENDED });
  }

  /**
   * Activate a virtual card
   * @param id Virtual card ID
   * @returns The activated virtual card
   */
  async activate(id: string): Promise<VirtualCard> {
    return this.update(id, { status: VirtualCardStatus.ACTIVE });
  }

  /**
   * Cancel a virtual card
   * @param id Virtual card ID
   * @returns The cancelled virtual card
   */
  async cancel(id: string): Promise<VirtualCard> {
    return this.update(id, { status: VirtualCardStatus.CANCELLED });
  }
}
