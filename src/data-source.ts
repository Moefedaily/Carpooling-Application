import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const databaseUrl = process.env.JAWSDB_URL || process.env.DATABASE_URL;

export const AppDataSource = new DataSource({
  type: 'mysql',
  url: databaseUrl,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});
