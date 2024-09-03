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
import { RolesService } from 'src/roles/roles.service';
import * as argon from 'argon2';

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
    private rolesService: RolesService,
  ) {}

  async register(registerUserDto: RegisterUserDto): Promise<User> {
    try {
      const { password, roleId, ...userData } = registerUserDto;
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email },
      });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
      const hashedPassword = await argon.hash(password);
      let role;
      if (roleId) {
        role = await this.rolesService.findOne(roleId);
        if (!role) {
          throw new NotFoundException(`Role with ID ${roleId} not found`);
        }
      } else {
        role = await this.rolesService.findByName('passenger');
      }

      const user = this.userRepository.create({
        ...userData,
        password: hashedPassword,
        isEmailConfirmed: false,
        role: role,
      });
      const savedUser = await this.userRepository.save(user);
      const token = this.jwtService.sign({ email: user.email, sub: user.id });
      await this.emailService.sendUserRegistration(savedUser, token);
      return savedUser;
    } catch (error) {
      this.logger.error(
        `Registration failed for email ${registerUserDto.email}`,
        error.stack,
      );
      if (error.message === 'Failed to send registration email') {
        throw new Error(
          'Registration successful but failed to send confirmation email. Please contact support.',
        );
      }
      throw new Error('Registration failed. Please try again later.');
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
    const payload = { email: user.email, sub: user.id };
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
      const payload = this.jwtService.verify(token);
      this.logger.debug(`Token verified. Payload: ${JSON.stringify(payload)}`);
      return payload;
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
