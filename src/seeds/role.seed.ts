import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { Role } from 'src/roles/entities/role.entity';
import { DataSource } from 'typeorm';

async function seedRoles() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  const roleRepository = dataSource.getRepository(Role);

  const rolesToSeed = [
    { name: 'ADMIN' },
    { name: 'DRIVER' },
    { name: 'PASSENGER' },
    { name: 'BOTH' },
  ];

  for (const roleData of rolesToSeed) {
    const existingRole = await roleRepository.findOne({
      where: { name: roleData.name },
    });
    if (!existingRole) {
      const newRole = roleRepository.create(roleData);
      await roleRepository.save(newRole);
      console.log(`Role ${roleData.name} has been created.`);
    } else {
      console.log(`Role ${roleData.name} already exists.`);
    }
  }

  console.log('Role seeding completed.');
  await app.close();
}

seedRoles().catch((error) => {
  console.error('Error seeding roles:', error);
  process.exit(1);
});
