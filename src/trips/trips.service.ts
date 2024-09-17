import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { Trip, TripStatus } from './entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/dto/create-notification.dto';
import { ReservationService } from 'src/reservation/reservation.service';
import {
  Reservation,
  ReservationStatus,
} from 'src/reservation/entities/reservation.entity';
import { Car } from 'src/cars/entities/car.entity';
import { License } from 'src/license/entities/license.entity';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class TripsService {
  private logger = new Logger('TripsService');

  constructor(
    @InjectRepository(Trip)
    private tripsRepository: Repository<Trip>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Car)
    private carRepository: Repository<Car>,
    @InjectRepository(License)
    private licenseRepository: Repository<License>,
    private reservationsService: ReservationService,
    private notificationsService: NotificationsService,
    private authService: AuthService,
  ) {}

  async create(createTripDto: CreateTripDto, driverId: number): Promise<Trip> {
    const { carId, availableSeats, ...tripData } = createTripDto;

    const car = await this.carRepository.findOne({
      where: { id: carId, driver: { id: driverId } },
    });
    if (!car) {
      throw new NotFoundException(
        'Car not found or does not belong to the driver',
      );
    }

    const isVerifiedDriver = await this.authService.isVerifiedDriver(driverId);

    if (!isVerifiedDriver) {
      throw new ForbiddenException('Only verified drivers can create trips');
    }
    if (availableSeats > car.numberOfSeats) {
      throw new BadRequestException(
        `Available seats cannot exceed car capacity of ${car.numberOfSeats}`,
      );
    }

    const driver = await this.usersRepository.findOne({
      where: { id: driverId },
    });

    const trip = this.tripsRepository.create({
      ...tripData,
      car,
      driver,
      availableSeats,
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

  async joinTrip(
    id: number,
    passengerId: number,
    numberOfSeats: number,
  ): Promise<{ trip: Trip; reservation: Reservation }> {
    const trip = await this.tripsRepository.findOne({
      where: { id },
      relations: ['driver', 'car', 'passengers'],
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    const passenger = await this.usersRepository.findOne({
      where: { id: passengerId },
    });

    this.logger.debug(`Joining trip ${trip.id} for passenger ${passengerId}`);
    if (!passenger) {
      throw new NotFoundException('Passenger not found');
    }

    if (
      trip.status !== TripStatus.PENDING &&
      trip.status !== TripStatus.CONFIRMED
    ) {
      throw new BadRequestException('Can only join pending or confirmed trips');
    }

    if (trip.availableSeats < numberOfSeats) {
      throw new BadRequestException(
        `Not enough seats available. Only ${trip.availableSeats} seats left.`,
      );
    }
    const totalAmount = trip.pricePerSeat * numberOfSeats;

    const existingReservation =
      await this.reservationsService.findByTripAndPassengerId(
        trip.id,
        passengerId,
      );
    if (existingReservation) {
      throw new BadRequestException(
        'Passenger already has a reservation for this trip',
      );
    }
    const reservation = await this.reservationsService.create({
      numberOfSeats,
      status: ReservationStatus.CONFIRMED,
      totalAmount,
      tripId: trip.id,
      passengerId: passenger.id,
    });

    trip.availableSeats -= numberOfSeats;
    if (trip.availableSeats === 0) {
      trip.status = TripStatus.FULL;
    }

    if (!trip.passengers.some((p) => p.id === passengerId)) {
      trip.passengers.push(passenger);
    }

    const updatedTrip = await this.tripsRepository.save(trip);

    await this.notificationsService.create({
      content: `You have joined the trip from ${trip.departureLocation} to ${trip.arrivalLocation} with ${numberOfSeats} seat(s)`,
      userId: passengerId,
      type: NotificationType.TRIP_JOINED,
      relatedEntityId: trip.id,
    });

    await this.notificationsService.create({
      content: `A new passenger has joined your trip to ${trip.arrivalLocation} with ${numberOfSeats} seat(s)`,
      userId: trip.driver.id,
      type: NotificationType.PASSENGER_JOINED,
      relatedEntityId: trip.id,
    });

    return { trip: updatedTrip, reservation };
  }

  async leaveTrip(id: number, passengerId: number): Promise<Trip> {
    const trip = await this.findOne(id);
    console.log('Trip:', trip);

    if (
      trip.status !== TripStatus.PENDING &&
      trip.status !== TripStatus.CONFIRMED &&
      trip.status !== TripStatus.FULL
    ) {
      throw new BadRequestException(
        'Can only leave pending, confirmed, or full trips',
      );
    }
    this.logger.debug('passengerId trip service:', passengerId);
    this.logger.debug('Id trip service:', id);

    const reservation = await this.reservationsService.findByTripAndPassengerId(
      id,
      passengerId,
    );
    this.logger.debug('Reservation trip service:', reservation);
    if (!reservation) {
      throw new BadRequestException(
        'Passenger does not have a reservation for this trip',
      );
    }

    await this.reservationsService.remove(reservation.id);

    trip.availableSeats += reservation.numberOfSeats;
    if (trip.status === TripStatus.FULL) {
      trip.status = TripStatus.CONFIRMED;
    }

    trip.passengers = trip.passengers.filter((p) => p.id !== passengerId);

    const updatedTrip = await this.tripsRepository.save(trip);

    await this.notificationsService.create({
      content: `You have left the trip from ${trip.departureLocation} to ${trip.arrivalLocation}`,
      userId: passengerId,
      type: NotificationType.TRIP_LEFT,
      relatedEntityId: trip.id,
    });

    await this.notificationsService.create({
      content: `A passenger has left your trip to ${trip.arrivalLocation}`,
      userId: trip.driver.id,
      type: NotificationType.PASSENGER_LEFT,
      relatedEntityId: trip.id,
    });

    return updatedTrip;
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
  async searchTrips(
    departureLocation: string,
    arrivalLocation: string,
    departureDate: Date,
    numberOfPassengers: number,
  ): Promise<Trip[]> {
    return this.tripsRepository.find({
      where: {
        departureLocation,
        arrivalLocation,
        departureDate,
        availableSeats: MoreThanOrEqual(numberOfPassengers),
        status: In[(TripStatus.PENDING, TripStatus.CONFIRMED)],
      },
      relations: ['driver', 'car'],
    });
  }

  async getPopularTrips(limit: number = 5): Promise<Trip[]> {
    const trips = await this.tripsRepository.find({
      relations: ['reservations', 'driver', 'car'],
      where: {
        status: In[(TripStatus.PENDING, TripStatus.CONFIRMED, TripStatus.FULL)],
      },
      order: {
        reservations: {
          id: 'DESC',
        },
      },
      take: limit,
    });

    trips.sort((a, b) => b.reservations.length - a.reservations.length);

    return trips;
  }
}
