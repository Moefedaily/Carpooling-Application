import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const jawsDbUrl = process.env.JAWSDB_URL;
let dataSourceConfig: any;

if (jawsDbUrl) {
  const url = new URL(jawsDbUrl);
  dataSourceConfig = {
    type: 'mysql',
    host: url.hostname,
    port: parseInt(url.port, 10),
    username: url.username,
    password: url.password,
    database: url.pathname.substr(1),
  };
} else {
  dataSourceConfig = {
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };
}

export const AppDataSource = new DataSource({
  ...dataSourceConfig,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
});
