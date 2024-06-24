import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  HttpException,
  Get,
  Query,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import {
  ApiResponse,
  successResponse,
  errorResponse,
} from '../utils/response.util';
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerUserDto: RegisterUserDto,
  ): Promise<ApiResponse<User>> {
    try {
      const user = await this.authService.register(registerUserDto);
      return successResponse('User registered successfully', user);
    } catch (error) {
      return errorResponse('Registration failed', [error.message]);
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginUserDto: LoginUserDto,
  ): Promise<ApiResponse<{ accessToken: string }>> {
    try {
      const result = await this.authService.login(loginUserDto);
      return successResponse('Login successful', result);
    } catch (error) {
      return errorResponse('Login failed', [error.message]);
    }
  }
  @Post('request-password-reset')
  async requestPasswordReset(@Body('email') email: string) {
    try {
      await this.authService.requestPasswordReset(email);
      return { message: 'Password reset email sent successfully' };
    } catch (error) {
      throw new HttpException(
        'Failed to send password reset email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: { token: string; newPassword: string },
  ) {
    try {
      await this.authService.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      );
      return { message: 'Password reset successfully' };
    } catch (error) {
      throw new HttpException(
        'Failed to reset password',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('confirm-email')
  async confirmEmail(@Query('token') token: string) {
    try {
      await this.authService.confirmEmail(token);
      return { message: 'Email confirmed successfully' };
    } catch (error) {
      this.logger.error(`Failed to confirm email: ${error.message}`);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
