import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TripsService } from '../trips.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Trip, TripStatus } from './trip.entity';
import { User } from 'src/users/entities/user.entity';
import { License } from 'src/license/entities/license.entity';
import { ReservationService } from 'src/reservation/reservation.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { AuthService } from 'src/auth/auth.service';
import { Car } from 'src/cars/entities/car.entity';
import { ReservationStatus } from 'src/reservation/entities/reservation.entity';
import { NotificationType } from 'src/notifications/dto/create-notification.dto';

describe('TripsService', () => {
  let service: TripsService;
  let mockTripRepository;
  let mockUserRepository;
  let mockCarRepository;
  let mockLicenseRepository;
  let mockReservationService;
  let mockNotificationsService;
  let mockAuthService;

  beforeEach(async () => {
    mockTripRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockUserRepository = {
      findOne: jest.fn(),
    };

    mockCarRepository = {
      findOne: jest.fn(),
    };

    mockLicenseRepository = {
      findOne: jest.fn(),
    };

    mockReservationService = {
      create: jest.fn(),
      findByTripAndPassengerId: jest.fn(),
    };

    mockNotificationsService = {
      create: jest.fn(),
    };

    mockAuthService = {
      isVerifiedDriver: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        {
          provide: getRepositoryToken(Trip),
          useValue: mockTripRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Car),
          useValue: mockCarRepository,
        },
        {
          provide: getRepositoryToken(License),
          useValue: mockLicenseRepository,
        },
        {
          provide: ReservationService,
          useValue: mockReservationService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
  });

  it(' defined', () => {
    expect(service).toBeDefined();
  });

  describe('joinTrip', () => {
    it('successfully join a trip', async () => {
      const mockTrip = {
        id: 1,
        status: TripStatus.PENDING,
        availableSeats: 3,
        pricePerSeat: 10,
        driver: { id: 2 },
        passengers: [],
        arrivalLocation: 'Destination',
        departureLocation: 'Start',
      };
      const mockUser = { id: 1 };

      mockTripRepository.findOne.mockResolvedValue(mockTrip);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockReservationService.findByTripAndPassengerId.mockResolvedValue(null);
      mockReservationService.create.mockResolvedValue({
        id: 1,
        numberOfSeats: 2,
        status: ReservationStatus.PENDING,
        totalAmount: 20,
        tripId: 1,
        passengerId: 1,
      });

      mockTripRepository.save.mockResolvedValue({
        ...mockTrip,
        availableSeats: 1,
        passengers: [mockUser],
      });

      const result = await service.joinTrip(1, 1, 2);

      expect(result.trip.availableSeats).toBe(1);
      expect(result.trip.passengers).toContainEqual(mockUser);
      expect(result.reservation).toEqual({
        id: 1,
        numberOfSeats: 2,
        status: ReservationStatus.PENDING,
        totalAmount: 20,
        tripId: 1,
        passengerId: 1,
      });
      expect(mockReservationService.create).toHaveBeenCalledWith({
        numberOfSeats: 2,
        status: ReservationStatus.PENDING,
        totalAmount: 20,
        tripId: 1,
        passengerId: 1,
      });
      expect(mockNotificationsService.create).toHaveBeenCalledWith({
        content: `A new passenger has joined your trip to Destination with 2 seat(s)`,
        userId: 2,
        type: NotificationType.PASSENGER_JOINED,
        relatedEntityId: 1,
      });
    });

    it('throw NotFoundException for non-existent trip', async () => {
      mockTripRepository.findOne.mockResolvedValue(null);

      await expect(service.joinTrip(1, 1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throw BadRequestException when not enough seats', async () => {
      const mockTrip = {
        id: 1,
        status: TripStatus.PENDING,
        availableSeats: 1,
        pricePerSeat: 10,
        driver: { id: 2 },
        passengers: [],
      };

      mockTripRepository.findOne.mockResolvedValue(mockTrip);
      mockUserRepository.findOne.mockResolvedValue({ id: 1 });

      await expect(service.joinTrip(1, 1, 2)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throw BadRequestException for invalid trip status', async () => {
      const mockTrip = {
        id: 1,
        status: TripStatus.COMPLETED,
        availableSeats: 3,
        pricePerSeat: 10,
        driver: { id: 2 },
        passengers: [],
      };

      mockTripRepository.findOne.mockResolvedValue(mockTrip);
      mockUserRepository.findOne.mockResolvedValue({ id: 1 });

      await expect(service.joinTrip(1, 1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throw BadRequestException if user already has a reservation', async () => {
      const mockTrip = {
        id: 1,
        status: TripStatus.PENDING,
        availableSeats: 3,
        pricePerSeat: 10,
        driver: { id: 2 },
        passengers: [],
      };

      mockTripRepository.findOne.mockResolvedValue(mockTrip);
      mockUserRepository.findOne.mockResolvedValue({ id: 1 });
      mockReservationService.findByTripAndPassengerId.mockResolvedValue({
        id: 1,
      });

      await expect(service.joinTrip(1, 1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
