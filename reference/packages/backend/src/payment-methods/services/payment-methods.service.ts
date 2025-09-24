import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentMethod, PaymentMethodType } from '@prisma/client';
import { CreatePaymentMethodDto } from '../dto/create-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PaymentMethod | null> {
    return this.prisma.paymentMethod.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<PaymentMethod[]> {
    return this.prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(userId: string, createPaymentMethodDto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Create payment method
    return this.prisma.paymentMethod.create({
      data: {
        userId,
        type: createPaymentMethodDto.type,
        // Store name in metadata since it's not in the schema
        metadata: JSON.stringify({
          displayName: createPaymentMethodDto.name,
          ...createPaymentMethodDto.details
        }),
        provider: createPaymentMethodDto.provider || 'TELEBIRR',
        isDefault: createPaymentMethodDto.isDefault || false,
        isVerified: createPaymentMethodDto.isVerified || false,
      },
    });
  }

  async update(id: string, data: Partial<CreatePaymentMethodDto>): Promise<PaymentMethod> {
    const paymentMethod = await this.findById(id);

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }

    return this.prisma.paymentMethod.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    const paymentMethod = await this.findById(id);

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }

    await this.prisma.paymentMethod.delete({
      where: { id },
    });
  }
}