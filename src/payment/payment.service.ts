import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Stripe } from 'stripe';
import { StripeService } from 'src/stripe/stripe.service';
import {
  Reservation,
  ReservationStatus,
} from 'src/reservation/entities/reservation.entity';
import { NotificationType } from 'src/notifications/dto/create-notification.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    private stripeService: StripeService,
    private notificationsService: NotificationsService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
  }

  async initiatePayment(
    reservationId: number,
  ): Promise<{ clientSecret: string }> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
      relations: ['passenger'],
    });
    if (!reservation) {
      throw new NotFoundException(
        `Reservation with ID ${reservationId} not found`,
      );
    }

    const amountInCents = Math.round(reservation.totalAmount * 100);

    const paymentIntent = await this.stripeService.createPaymentIntent(
      amountInCents,
      'eur',
      reservation.passenger.stripeUserId,
    );
    const payment = this.paymentRepository.create({
      amount: reservation.totalAmount,
      paymentDate: new Date(),
      paymentMethod: 'stripe',
      status: PaymentStatus.PENDING,
      reservationId: reservation.id,
      userId: reservation.passenger.id,
      stripePaymentIntentId: paymentIntent.id,
    });

    await this.paymentRepository.save(payment);

    return { clientSecret: paymentIntent.client_secret };
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
  async completePayment(paymentIntentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
      relations: ['reservation'],
    });
    if (!payment) {
      throw new NotFoundException(
        `Payment with PaymentIntent ID ${paymentIntentId} not found`,
      );
    }

    const paymentIntent =
      await this.stripeService.retrievePaymentIntent(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      await this.notificationsService.create({
        content: `Payment of ${payment.amount} € for your trip has been successfully processed.`,
        userId: payment.userId,
        type: NotificationType.PAYMENT_SUCCESS,
        relatedEntityId: payment.id,
      });

      payment.status = PaymentStatus.COMPLETED;
      payment.reservation.status = ReservationStatus.CONFIRMED;
    }

    await this.reservationRepository.save(payment.reservation);
    return this.paymentRepository.save(payment);
  }

  async failPayment(paymentIntentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
      relations: ['reservation'],
    });
    if (!payment) {
      throw new NotFoundException(
        `Payment with PaymentIntent ID ${paymentIntentId} not found`,
      );
    }
    payment.status = PaymentStatus.FAILED;
    payment.reservation.status = ReservationStatus.PAYMENT_FAILED;
    await this.reservationRepository.save(payment.reservation);
    await this.notificationsService.create({
      content: `Payment of ${payment.amount} € for your trip has failed. Please update your payment method.`,
      userId: payment.userId,
      type: NotificationType.PAYMENT_FAILURE,
      relatedEntityId: payment.id,
    });
    return this.paymentRepository.save(payment);
  }
}
