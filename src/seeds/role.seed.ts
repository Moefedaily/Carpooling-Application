import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Role } from '../roles/entities/role.entity';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

async function seedRoles() {
  const logger = new Logger('RoleSeed');
  let app;

  try {
    app = await NestFactory.create(AppModule);
    await app.init();

    const dataSource = app.get(DataSource);
    const roleRepository = dataSource.getRepository(Role);

    const roles = ['PASSENGER', 'DRIVER', 'BOTH'];

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

if (require.main === module) {
  seedRoles()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
