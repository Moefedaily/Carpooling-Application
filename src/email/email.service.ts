import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '../users/entities/user.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private mailerService: MailerService) {}

  async sendUserRegistration(user: User, token: string): Promise<void> {
    const url = `${process.env.APP_URL}/auth/confirm-email?token=${token}`;
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Welcome to Carpooling App! Confirm your Email',
        template: 'registration',
        context: {
          name: user.firstName,
          url,
        },
      });
      this.logger.log(`Registration email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send registration email to ${user.email}`,
        error.stack,
      );
      throw new Error('Failed to send registration email');
    }
  }
  async sendAccountValidation(user: User) {
    this.logger.log(`Sending account validation email to ${user.email}`);
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Your Account has been Validated',
        template: 'account-validation',
        context: {
          name: user.firstName,
        },
      });
      this.logger.log(`Account validation email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send account validation email to ${user.email}`,
        error.stack,
      );
      throw new Error('Failed to send account validation email');
    }
  }

  async sendPasswordReset(user: User, token: string) {
    const url = `${process.env.APP_URL}/auth/reset-password?token=${token}`;
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Password Reset Request',
        template: 'password-reset',
        context: {
          name: user.firstName,
          url,
        },
      });
      this.logger.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${user.email}`,
        error.stack,
      );
      throw new Error('Failed to send password reset email');
    }
  }
  async sendPasswordChangeConfirmation(user: User) {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Your Password Has Been Changed',
        template: 'password-changed',
        context: {
          name: user.firstName,
        },
      });
      this.logger.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${user.email}`,
        error.stack,
      );
      throw new Error('Failed to send password reset email');
    }
  }
}
