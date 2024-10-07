import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiResponse,
  successResponse,
  errorResponse,
} from '../utils/response.util';

@Controller('api/users')
export class UsersController {
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
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse<User>> {
    try {
      const updatedUser = await this.usersService.update(id, updateUserDto);
      return successResponse('User updated successfully', updatedUser);
    } catch (error) {
      return errorResponse('Failed to update user', [error.message]);
    }
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
