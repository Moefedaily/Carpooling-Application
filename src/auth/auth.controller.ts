import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
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
}
