import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CarService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';

@Controller('api/cars')
@UseGuards(JwtAuthGuard)
export class CarsController {
  private logger = new Logger(CarsController.name);
  constructor(private readonly carService: CarService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() createCarDto: CreateCarDto) {
    this.logger.debug(`Request user: ${JSON.stringify(req.user)}`);
    this.logger.debug(`createCarDto: ${JSON.stringify(createCarDto)}`);
    return this.carService.create(createCarDto, req.user.userId);
  }
  @Get('/owner')
  carsForUser(@Request() req) {
    return this.carService.carsForUser(req.user.userId);
  }

  @Get()
  findAll() {
    return this.carService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.carService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateCarDto: UpdateCarDto,
  ) {
    const car = await this.carService.findOne(+id);
    if (car.driver.id !== req.user.userId) {
      throw new BadRequestException('You can only update your own cars');
    }
    return this.carService.update(+id, updateCarDto, req.user.userId);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    const car = await this.carService.findOne(+id);
    if (car.driver.id !== req.user.userId) {
      throw new BadRequestException('You can only delete your own cars');
    }
    return this.carService.remove(+id);
  }
}
