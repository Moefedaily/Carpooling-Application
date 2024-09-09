import { Module } from '@nestjs/common';
import { LicenseService } from './license.service';
import { LicenseController } from './license.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { License } from './entities/license.entity';
import { User } from 'src/users/entities/user.entity';
import { Car } from 'src/cars/entities/car.entity';

@Module({
  imports: [TypeOrmModule.forFeature([License, User, Car])],
  controllers: [LicenseController],
  providers: [LicenseService],
  exports: [LicenseService],
})
export class LicenseModule {}
