import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as argon from 'argon2';
import { LicenseService } from 'src/license/license.service';
import { StripeService } from 'src/stripe/stripe.service';
import { CreateLicenseDto } from 'src/license/dto/create-license.dto';
import { verificationStatus } from 'src/cars/entities/car.entity';
import { Role } from 'src/roles/entities/role.entity';
import { RolesService } from 'src/roles/roles.service';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private licenseService: LicenseService,
    private stripeService: StripeService,
    private rolesService: RolesService,
  ) {}

  async register(registerUserDto: RegisterUserDto): Promise<User> {
    const { password, email, isInterestedInDriving, roleId, ...userData } =
      registerUserDto;

    try {
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const hashedPassword = await argon.hash(password);

      let role: Role;
      if (roleId) {
        role = await this.rolesService.findOne(roleId);
        if (!role) {
          throw new NotFoundException(`Role with ID ${roleId} not found`);
        }
      } else {
        role = await this.rolesService.findByName('PASSENGER');
      }

      const user = this.userRepository.create({
        ...userData,
        email,
        password: hashedPassword,
        isEmailConfirmed: false,
        isInterestedInDriving: isInterestedInDriving || false,
        role: role,
      });

      try {
        const stripeCustomer = await this.stripeService.createCustomer(
          user.email,
          `${user.firstName} ${user.lastName}`,
        );
        user.stripeUserId = stripeCustomer.id;
      } catch (error) {
        this.logger.error(`Failed to create Stripe customer: ${error.message}`);
      }

      const savedUser = await this.userRepository.save(user);

      const token = this.jwtService.sign({
        email: user.email,
        sub: user.id,
      });

      await this.emailService.sendUserRegistration(savedUser, token);

      return savedUser;
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw error;
    }
  }
  async validateUser(loginUserDto: LoginUserDto): Promise<any> {
    const { email, password } = loginUserDto;
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && (await argon.verify(user.password, password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async registerAsDriver(
    userId: number,
    createLicenseDto: CreateLicenseDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.debug(`User found: ${JSON.stringify(user)}`);
    await this.licenseService.create({
      ...createLicenseDto,
      driverId: user.id,
    });

    user.isInterestedInDriving = true;

    if (user.role.name === 'PASSENGER') {
      const bothRole = await this.rolesService.findByName('BOTH');
      user.role = bothRole;
    }

    return this.userRepository.save(user);
  }
  async login(loginUserDto: LoginUserDto): Promise<{ accessToken: string }> {
    const user = await this.validateUser(loginUserDto);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isEmailConfirmed) {
      throw new UnauthorizedException(
        'Please confirm your email before logging in',
      );
    }
    const payload = {
      email: user.email,
      sub: user.id,
      isVerifiedDriver: user.isVerifiedDriver,
    };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });
    return { accessToken };
  }
  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    this.logger.debug(`requestPasswordReset: ${JSON.stringify(user)}`);
    if (!user) {
      throw new NotFoundException(
        'If a user with this email exists, a password reset link will be sent.',
      );
    }
    const token = this.jwtService.sign(
      { email: user.email, sub: user.id },
      { expiresIn: '1h' },
    );
    await this.emailService.sendPasswordReset(user, token);
    return {
      message:
        'If a user with this email exists, a password reset link has been sent.',
    };
  }
  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findByEmail(payload.email);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const hashedPassword = await argon.hash(newPassword);
      await this.usersService.updatePassword(user.id, hashedPassword);
      await this.emailService.sendPasswordChangeConfirmation(user);
      return { message: 'Password reset successfully' };
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      }
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token has expired');
      }
      throw error;
    }
  }
  async confirmEmail(token: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(token);
      this.logger.debug(`confirmEmail payload: ${JSON.stringify(payload)}`);
      const user = await this.usersService.findByEmail(payload.email);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.isEmailConfirmed) {
        throw new BadRequestException('Email already confirmed');
      }

      const confirmedUser = await this.usersService.confirmEmail(user.id);
      await this.emailService.sendAccountValidation(confirmedUser);
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      }

      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token has expired');
      }
      throw error;
    }
  }

  async validateToken(token: string) {
    this.logger.debug(
      `Attempting to verify token: ${token.substring(0, 10)}...`,
    );
    try {
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      const payload = this.jwtService.verify(cleanToken);
      this.logger.debug(`Token verified. Payload: ${JSON.stringify(payload)}`);
      return payload;
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  async isVerifiedDriver(userId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['license'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isVerifiedDriver = true;
    return (
      !!user.license && user.license.status === verificationStatus.VERIFIED
    );
  }
}
