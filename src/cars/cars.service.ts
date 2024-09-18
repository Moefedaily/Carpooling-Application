import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { Car } from './entities/car.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class CarService {
  constructor(
    @InjectRepository(Car)
    private carRepository: Repository<Car>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createCarDto: CreateCarDto, driverId: number): Promise<Car> {
    const user = await this.userRepository.findOne({
      where: { id: driverId },
      relations: ['role'],
    });

    const existingLicensePlate = await this.carRepository.findOne({
      where: { licensePlate: createCarDto.licensePlate },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${driverId} not found`);
    }

    if (existingLicensePlate) {
      throw new BadRequestException('License plate already exists');
    }

    if (user.role.name !== 'BOTH') {
      throw new ForbiddenException('Only drivers can create cars');
    }

    const car = this.carRepository.create({
      ...createCarDto,
      driver: user,
    });

    return this.carRepository.save(car);
  }

  async findAll(): Promise<Car[]> {
    return this.carRepository.find({ relations: ['driver'] });
  }

  async findOne(id: number): Promise<Car> {
    const car = await this.carRepository.findOne({
      where: { id },
      relations: ['driver'],
    });
    if (!car) {
      throw new NotFoundException(`Car with ID ${id} not found`);
    }
    return car;
  }

  async update(
    id: number,
    updateCarDto: UpdateCarDto,
    driverId: number,
  ): Promise<Car> {
    const car = await this.findOne(id);
    if (driverId) {
      const driver = await this.userRepository.findOne({
        where: { id: driverId },
      });
      if (!driver) {
        throw new NotFoundException(`Driver with ID ${driverId} not found`);
      }
      car.driver = driver;
    }
    Object.assign(car, updateCarDto);
    return this.carRepository.save(car);
  }

  async remove(id: number): Promise<void> {
    const result = await this.carRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Car with ID ${id} not found`);
    }
  }
}
