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
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/dto/create-notification.dto';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private tripsRepository: Repository<Trip>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
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

    const savedTrip = await this.tripsRepository.save(trip);

    await this.notificationsService.create({
      userId: driverId,
      type: NotificationType.TRIP_CREATED,
      content: `Your trip from ${trip.departureLocation} to ${trip.arrivalLocation} has been created successfully.`,
      relatedEntityId: savedTrip.id,
    });

    return savedTrip;
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
    const updatedTrip = await this.tripsRepository.save(trip);

    await this.notificationsService.create({
      userId: trip.driver.id,
      type: NotificationType.TRIP_UPDATE,
      content: `Your trip to ${trip.arrivalLocation} has been updated.`,
      relatedEntityId: trip.id,
    });

    for (const passenger of trip.passengers) {
      await this.notificationsService.create({
        userId: passenger.id,
        type: NotificationType.TRIP_UPDATE,
        content: `The trip to ${trip.arrivalLocation} has been updated. Please check the new details.`,
        relatedEntityId: trip.id,
      });
    }
    return updatedTrip;
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

    const updatedTrip = await this.tripsRepository.save(trip);

    await this.notificationsService.create({
      content: `You have joined the trip from ${trip.departureLocation} to ${trip.arrivalLocation}`,
      userId: passengerId,
      type: NotificationType.TRIP_JOINED,
      relatedEntityId: trip.id,
    });

    await this.notificationsService.create({
      content: `A new passenger has joined your trip to ${trip.arrivalLocation}`,
      userId: trip.driver.id,
      type: NotificationType.PASSENGER_JOINED,
      relatedEntityId: trip.id,
    });

    return updatedTrip;
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
    const updatedTrip = await this.tripsRepository.save(trip);

    const notificationContent =
      this.getStatusUpdateNotificationContent(newStatus);

    await this.notificationsService.create({
      content: notificationContent,
      userId: trip.driver.id,
      type: NotificationType.TRIP_STATUS_UPDATE,
      relatedEntityId: updatedTrip.id,
    });
    for (const passenger of trip.passengers) {
      await this.notificationsService.create({
        content: notificationContent,
        userId: passenger.id,
        type: NotificationType.TRIP_STATUS_UPDATE,
        relatedEntityId: trip.id,
      });
    }

    return updatedTrip;
  }

  async isUserPassenger(userId: number, tripId: number): Promise<boolean> {
    const trip = await this.findOne(tripId);
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    return trip.passengers.some((p) => p.id === userId);
  }

  private getStatusUpdateNotificationContent(status: TripStatus): string {
    switch (status) {
      case TripStatus.CONFIRMED:
        return 'The trip has been confirmed';
      case TripStatus.CANCELLED:
        return 'The trip has been cancelled';
      case TripStatus.IN_PROGRESS:
        return 'The trip is now in progress';
      case TripStatus.COMPLETED:
        return 'The trip has been completed';
      default:
        return `Trip status has been updated to ${status}`;
    }
  }
}
