import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        if (isProduction) {
          const url = new URL(configService.get('JAWSDB_URL'));
          return {
            type: 'mysql',
            host: url.hostname,
            port: parseInt(url.port, 10),
            username: url.username,
            password: url.password,
            database: url.pathname.substr(1),
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize: false,
            ssl: {
              rejectUnauthorized: false,
            },
          };
        } else {
          return {
            type: 'mysql',
            host: configService.get('DB_HOST'),
            port: +configService.get<number>('DB_PORT'),
            username: configService.get('DB_USERNAME'),
            password: configService.get('DB_PASSWORD'),
            database: configService.get('DB_NAME'),
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize: true,
          };
        }
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
