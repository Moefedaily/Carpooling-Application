import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Role } from '../roles/entities/role.entity';
import { getRepository } from 'typeorm';

export async function seedRoles() {
  const app = await NestFactory.create(AppModule);
  const roleRepository = getRepository(Role);

  const roles = ['PASSENGER', 'DRIVER', 'BOTH'];

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

// This allows the function to be called directly when the file is run as a script
if (require.main === module) {
  seedRoles().catch((error) => {
    console.error('Error seeding roles:', error);
    process.exit(1);
  });
}
