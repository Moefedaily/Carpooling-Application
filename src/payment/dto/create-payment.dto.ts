import { PaymentStatus } from '../entities/payment.entity';

export class CreatePaymentDto {
  amount: number;
  reservationId: number;
  paymentMethod: string;
  status: PaymentStatus;
  paymentDate: Date;
  userId: number;
}
