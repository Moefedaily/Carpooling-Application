import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Stripe } from 'stripe';
import { User } from 'src/users/entities/user.entity';
import { StripeService } from 'src/stripe/stripe.service';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private stripeService: StripeService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const user = await this.userRepository.findOne({
      where: { id: createPaymentDto.userId },
    });
    if (!user) {
      throw new NotFoundException(
        `User with ID ${createPaymentDto.userId} not found`,
      );
    }

    if (!user.stripeUserId) {
      throw new Error(
        `User with ID ${createPaymentDto.userId} does not have a Stripe customer ID`,
      );
    }

    const paymentIntent = await this.stripeService.createPaymentIntent(
      Math.round(createPaymentDto.amount * 100),
      'usd',
      user.stripeUserId,
    );

    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      stripePaymentIntentId: paymentIntent.id,
      user: user,
    });

    return this.paymentRepository.save(payment);
  }

  async findOne(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  async updateStatus(id: number, status: PaymentStatus): Promise<Payment> {
    const payment = await this.findOne(id);
    payment.status = status;
    return this.paymentRepository.save(payment);
  }
}
