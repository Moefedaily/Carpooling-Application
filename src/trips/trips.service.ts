import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { Trip, TripStatus } from './entities/trip.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private tripsRepository: Repository<Trip>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createTripDto: CreateTripDto, driverId: number): Promise<Trip> {
    const driver = await this.usersRepository.findOne({
      where: { id: driverId },
    });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const trip = this.tripsRepository.create({
      ...createTripDto,
      driver,
      status: TripStatus.PENDING,
    });

    return this.tripsRepository.save(trip);
  }

  async findAll(status?: TripStatus): Promise<Trip[]> {
    const query = this.tripsRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.driver', 'driver')
      .leftJoinAndSelect('trip.passengers', 'passengers');

    if (status) {
      query.where('trip.status = :status', { status });
    }

    return query.getMany();
  }

  async findDriverTrips(
    driverId: number,
    status?: TripStatus,
  ): Promise<Trip[]> {
    const query = this.tripsRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.passengers', 'passengers')
      .where('trip.driverId = :driverId', { driverId });

    if (status) {
      query.andWhere('trip.status = :status', { status });
    }

    return query.getMany();
  }

  async findPassengerTrips(
    passengerId: number,
    status?: TripStatus,
  ): Promise<Trip[]> {
    const query = this.tripsRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.driver', 'driver')
      .leftJoinAndSelect('trip.passengers', 'passengers')
      .where('passengers.id = :passengerId', { passengerId });

    if (status) {
      query.andWhere('trip.status = :status', { status });
    }

    return query.getMany();
  }

  async findOne(id: number): Promise<Trip> {
    const trip = await this.tripsRepository.findOne({
      where: { id },
      relations: ['driver', 'passengers'],
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    return trip;
  }

  async update(
    id: number,
    updateTripDto: UpdateTripDto,
    userId: number,
  ): Promise<Trip> {
    const trip = await this.findOne(id);
    if (trip.driver.id !== userId) {
      throw new ForbiddenException('Only the driver can update the trip');
    }
    if (trip.status !== TripStatus.PENDING) {
      throw new BadRequestException('Only pending trips can be updated');
    }
    Object.assign(trip, updateTripDto);
    return this.tripsRepository.save(trip);
  }

  async remove(id: number, userId: number): Promise<void> {
    const trip = await this.findOne(id);
    if (trip.driver.id !== userId) {
      throw new ForbiddenException('Only the driver can delete the trip');
    }
    if (trip.status !== TripStatus.PENDING) {
      throw new BadRequestException('Only pending trips can be deleted');
    }
    await this.tripsRepository.remove(trip);
  }

  async joinTrip(id: number, passengerId: number): Promise<Trip> {
    const trip = await this.findOne(id);
    const passenger = await this.usersRepository.findOne({
      where: { id: passengerId },
    });

    if (!passenger) {
      throw new NotFoundException('Passenger not found');
    }

    if (
      trip.status !== TripStatus.PENDING &&
      trip.status !== TripStatus.CONFIRMED
    ) {
      throw new BadRequestException('Can only join pending or confirmed trips');
    }

    if (trip.availableSeats <= 0) {
      throw new BadRequestException('No available seats');
    }

    if (trip.passengers.some((p) => p.id === passengerId)) {
      throw new BadRequestException('Passenger already joined this trip');
    }

    trip.passengers.push(passenger);
    trip.availableSeats--;

    if (trip.availableSeats === 0) {
      trip.status = TripStatus.FULL;
    }

    return this.tripsRepository.save(trip);
  }

  async leaveTrip(id: number, passengerId: number): Promise<Trip> {
    const trip = await this.findOne(id);
    console.log('trip', trip);

    if (
      trip.status !== TripStatus.PENDING &&
      trip.status !== TripStatus.CONFIRMED &&
      trip.status !== TripStatus.FULL
    ) {
      throw new BadRequestException(
        'Can only leave pending, confirmed, or full trips',
      );
    }

    const passengerIndex = trip.passengers.findIndex((p) => {
      console.log('Passenger ID:', p.id);
      console.log('Passenger ID (passed):', passengerId);
      return p.id === passengerId;
    });

    if (passengerIndex === -1) {
      throw new BadRequestException('Passenger is not part of this trip');
    }

    trip.passengers.splice(passengerIndex, 1);
    trip.availableSeats++;

    if (trip.status === TripStatus.FULL) {
      trip.status = TripStatus.CONFIRMED;
    }

    return this.tripsRepository.save(trip);
  }

  async updateTripStatus(
    id: number,
    newStatus: TripStatus,
    userId: number,
  ): Promise<Trip> {
    const trip = await this.findOne(id);
    if (trip.driver.id !== userId) {
      throw new ForbiddenException(
        'Only the driver can update the trip status',
      );
    }

    const validTransitions = {
      [TripStatus.PENDING]: [TripStatus.CONFIRMED, TripStatus.CANCELLED],
      [TripStatus.CONFIRMED]: [TripStatus.IN_PROGRESS, TripStatus.CANCELLED],
      [TripStatus.FULL]: [TripStatus.IN_PROGRESS, TripStatus.CANCELLED],
      [TripStatus.IN_PROGRESS]: [TripStatus.COMPLETED, TripStatus.CANCELLED],
      [TripStatus.COMPLETED]: [],
      [TripStatus.CANCELLED]: [],
    };

    if (!validTransitions[trip.status].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${trip.status} to ${newStatus}`,
      );
    }

    trip.status = newStatus;
    return this.tripsRepository.save(trip);
  }
}
