const isProduction = process.env.NODE_ENV === 'production';

let config;

if (isProduction) {
  const url = new URL(process.env.JAWSDB_URL);
  config = {
    type: 'mysql',
    host: url.hostname,
    port: parseInt(url.port, 10),
    username: url.username,
    password: url.password,
    database: url.pathname.substr(1),
    entities: [__dirname + '/dist/**/*.entity.js'],
    migrations: ['dist/migrations/*{.ts,.js}'],
    cli: {
      migrationsDir: 'src/migrations',
    },
    synchronize: false,
    ssl: {
      rejectUnauthorized: false,
    },
  };
} else {
  config = {
    type: 'mysql',
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [__dirname + '/dist/**/*.entity.js'],
    migrations: ['dist/migrations/*{.ts,.js}'],
    cli: {
      migrationsDir: 'src/migrations',
    },
    synchronize: false,
  };
}

module.exports = config;
