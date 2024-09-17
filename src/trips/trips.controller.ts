import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripStatus } from './entities/trip.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('api/trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  create(@Body() createTripDto: CreateTripDto, @Request() req) {
    console.log('req.user', req.user);
    return this.tripsService.create(createTripDto, req.user.userId);
  }
  @Get('search')
  async searchTrips(
    @Query('departureLocation') departureLocation: string,
    @Query('arrivalLocation') arrivalLocation: string,
    @Query('departureDate') departureDate: Date,
    @Query('numberOfPassengers') numberOfPassengers: number,
  ) {
    return this.tripsService.searchTrips(
      departureLocation,
      arrivalLocation,
      departureDate,
      numberOfPassengers,
    );
  }

  @Get('popular')
  async getPopularTrips(@Query('limit', ParseIntPipe) limit: number = 5) {
    return this.tripsService.getPopularTrips(limit);
  }

  @Get()
  findAll(@Query('status') status: TripStatus) {
    return this.tripsService.findAll(status);
  }

  @Get('driver')
  async findDriverTrips(@Request() req, @Query('status') status: TripStatus) {
    const trips = await this.tripsService.findDriverTrips(
      req.user.userId,
      status,
    );
    return trips;
  }

  @Get('passenger')
  async findPassengerTrips(
    @Request() req,
    @Query('status') status: TripStatus,
  ) {
    return await this.tripsService.findPassengerTrips(req.user.userId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTripDto: UpdateTripDto,
    @Request() req,
  ) {
    return this.tripsService.update(+id, updateTripDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.tripsService.remove(+id, req.user.userId);
  }

  @Post(':id/join')
  joinTrip(
    @Param('id') id: string,
    @Request() req,
    @Body('numberOfSeats') numberOfSeats: number,
  ) {
    return this.tripsService.joinTrip(+id, req.user.userId, numberOfSeats);
  }

  @Post(':id/leave')
  leaveTrip(@Param('id') id: string, @Request() req) {
    return this.tripsService.leaveTrip(+id, req.user.userId);
  }

  @Patch(':id/confirm')
  confirmTrip(@Param('id') id: string, @Request() req) {
    return this.tripsService.updateTripStatus(
      +id,
      TripStatus.CONFIRMED,
      req.user.userId,
    );
  }

  @Patch(':id/start')
  startTrip(@Param('id') id: string, @Request() req) {
    return this.tripsService.updateTripStatus(
      +id,
      TripStatus.IN_PROGRESS,
      req.user.userId,
    );
  }

  @Patch(':id/complete')
  completeTrip(@Param('id') id: string, @Request() req) {
    return this.tripsService.updateTripStatus(
      +id,
      TripStatus.COMPLETED,
      req.user.userId,
    );
  }

  @Patch(':id/cancel')
  cancelTrip(@Param('id') id: string, @Request() req) {
    return this.tripsService.updateTripStatus(
      +id,
      TripStatus.CANCELLED,
      req.user.userId,
    );
  }
}
