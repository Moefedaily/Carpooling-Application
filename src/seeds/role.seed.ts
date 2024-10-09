import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepository } from 'typeorm';
import { Role } from '../roles/entities/role.entity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const roleRepository = getRepository(Role);

  const roles = ['ADMIN', 'DRIVER', 'PASSENGER', 'BOTH'];

  for (const roleName of roles) {
    const existingRole = await roleRepository.findOne({
      where: { name: roleName },
    });
    if (!existingRole) {
      const newRole = roleRepository.create({ name: roleName });
      await roleRepository.save(newRole);
      console.log(`Created role: ${roleName}`);
    } else {
      console.log(`Role already exists: ${roleName}`);
    }
  }

  await app.close();
}

bootstrap().catch((error) => {
  console.error('Error seeding roles:', error);
  process.exit(1);
});
