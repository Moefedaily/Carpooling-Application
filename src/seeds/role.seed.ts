import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepository } from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { Logger } from '@nestjs/common';

async function seedRoles() {
  const logger = new Logger('RoleSeed');
  let app;

  try {
    app = await NestFactory.create(AppModule);
    await app.init();

    const roleRepository = getRepository(Role);

    const roles = ['ADMIN', 'DRIVER', 'PASSENGER', 'BOTH'];

    for (const roleName of roles) {
      const existingRole = await roleRepository.findOne({
        where: { name: roleName },
      });
      if (!existingRole) {
        const newRole = roleRepository.create({ name: roleName });
        await roleRepository.save(newRole);
        logger.log(`Created role: ${roleName}`);
      } else {
        logger.log(`Role already exists: ${roleName}`);
      }
    }

    logger.log('Role seeding completed successfully');
  } catch (error) {
    logger.error(`Error seeding roles: ${error.message}`, error.stack);
    throw error;
  } finally {
    if (app) {
      await app.close();
    }
  }
}

// This allows the function to be called when the file is run directly
if (require.main === module) {
  seedRoles()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
