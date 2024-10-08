import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  ParseIntPipe,
  Request,
  ForbiddenException,
  Post,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiResponse,
  successResponse,
  errorResponse,
} from '../utils/response.util';
import { ChangePasswordDto } from './dto/changePassword-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  private logger = new Logger(UsersController.name);
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<ApiResponse<User[]>> {
    try {
      const users = await this.usersService.findAll();
      return successResponse('Users retrieved successfully', users);
    } catch (error) {
      return errorResponse('Failed to retrieve users', [error.message]);
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    this.logger.debug(`update user ${JSON.stringify(updateUserDto)}`);
    if (req.user.userId !== +id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.usersService.update(+id, updateUserDto);
  }

  @Post(':id/change-password')
  changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req,
  ) {
    if (req.user.userId !== +id) {
      throw new ForbiddenException('You can only change your own password');
    }
    return this.usersService.changePassword(+id, changePasswordDto);
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<null>> {
    try {
      await this.usersService.delete(id);
      return successResponse('User deleted successfully');
    } catch (error) {
      return errorResponse('Failed to delete user', [error.message]);
    }
  }
}
