import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLicenseDto } from './dto/create-license.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { License, verificationStatus } from './entities/license.entity';
import { User } from 'src/users/entities/user.entity';
import { Car } from 'src/cars/entities/car.entity';

@Injectable()
export class LicenseService {
  private logger = new Logger(LicenseService.name);
  constructor(
    @InjectRepository(License)
    private licenseRepository: Repository<License>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Car)
    private carRepository: Repository<Car>,
  ) {}

  async findByLicenseNumber(licenseNumber: string): Promise<License> {
    return this.licenseRepository.findOne({ where: { licenseNumber } });
  }

  async create(createLicenseDto: CreateLicenseDto): Promise<License> {
    const { licenseNumber, expirationDate, driverId } = createLicenseDto;

    const driver = await this.userRepository.findOne({
      where: { id: driverId },
    });
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    const license = this.licenseRepository.create({
      licenseNumber,
      expirationDate: new Date(expirationDate),
      driver,
    });

    return this.licenseRepository.save(license);
  }

  async findOne(id: number): Promise<License> {
    const license = await this.licenseRepository.findOne({
      where: { id },
      relations: ['driver'],
    });
    if (!license) {
      throw new NotFoundException(`License with ID ${id} not found`);
    }
    return license;
  }

  async findByDriver(driverId: number): Promise<License> {
    const license = await this.licenseRepository.findOne({
      where: { driver: { id: driverId } },
    });
    if (!license) {
      throw new NotFoundException(
        `License for driver with ID ${driverId} not found`,
      );
    }
    return license;
  }

  async update(
    id: number,
    updateLicenseDto: UpdateLicenseDto,
  ): Promise<License> {
    const license = await this.findOne(id);
    this.licenseRepository.merge(license, updateLicenseDto);
    return this.licenseRepository.save(license);
  }

  async remove(id: number): Promise<void> {
    const result = await this.licenseRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`License with ID ${id} not found`);
    }
  }

  async verifyLicense(id: number): Promise<License> {
    const license = await this.licenseRepository.findOne({
      where: { id },
      relations: ['driver'],
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    if (license.status === verificationStatus.VERIFIED) {
      throw new ForbiddenException('License is already verified');
    }

    try {
      license.status = verificationStatus.VERIFIED;
      await this.licenseRepository.save(license);

      await this.userRepository.update(license.driver.id, {
        isVerifiedDriver: true,
      });

      await this.carRepository.update(
        {
          driver: { id: license.driver.id },
          status: verificationStatus.PENDING,
        },
        { status: verificationStatus.VERIFIED },
      );
    } catch (error) {
      console.error('Error during license verification:', error);
      license.status = verificationStatus.PENDING;
      await this.licenseRepository.save(license);
      throw new ForbiddenException('Failed to verify license');
    }

    return this.licenseRepository.findOne({
      where: { id },
      relations: ['driver'],
    });
  }

  async isValid(id: number): Promise<boolean> {
    const license = await this.findByDriver(id);
    const currentDate = new Date();
    return license.expirationDate > currentDate;
  }

  async getTimeUntilExpiration(id: number): Promise<number> {
    const license = await this.findByDriver(id);
    const expirationDate = new Date(license.expirationDate);
    const now = new Date();
    const timeUntilExpiration = expirationDate.getTime() - now.getTime();
    return timeUntilExpiration;
  }
}
