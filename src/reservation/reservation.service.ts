import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { Trip } from 'src/trips/entities/trip.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    createReservationDto: CreateReservationDto,
  ): Promise<Reservation> {
    const { tripId, passengerId, ...reservationData } = createReservationDto;

    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    const passenger = await this.userRepository.findOne({
      where: { id: passengerId },
    });
    if (!passenger) {
      throw new NotFoundException(`User with ID ${passengerId} not found`);
    }

    const reservation = this.reservationRepository.create({
      ...reservationData,
      trip,
      passenger,
      status: ReservationStatus.PENDING,
    });

    return this.reservationRepository.save(reservation);
  }

  async findAll(): Promise<Reservation[]> {
    return this.reservationRepository.find();
  }

  async findOne(id: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
    });
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }
    return reservation;
  }

  async update(
    id: number,
    updateReservationDto: UpdateReservationDto,
  ): Promise<Reservation> {
    const reservation = await this.findOne(id);
    Object.assign(reservation, updateReservationDto);
    return this.reservationRepository.save(reservation);
  }

  async remove(id: number): Promise<void> {
    const result = await this.reservationRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }
  }

  async findByTripId(tripId: number): Promise<Reservation[]> {
    const reservations = await this.reservationRepository.find({
      where: { trip: { id: tripId } },
      relations: ['passenger', 'trip'],
    });

    if (reservations.length === 0) {
      throw new NotFoundException(
        `No reservations found for trip with ID ${tripId}`,
      );
    }

    return reservations;
  }

  async findByTripAndPassengerId(
    tripId: number,
    passengerId: number,
  ): Promise<Reservation | null> {
    const reservation = await this.reservationRepository.findOne({
      where: {
        trip: { id: tripId },
        passenger: { id: passengerId },
      },
      relations: ['trip', 'passenger'],
    });

    return reservation;
  }
}
