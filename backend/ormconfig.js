const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

module.exports = {
  type: 'postgres',
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'whatsapp_triage',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [path.resolve(__dirname, 'src/**/*.entity{.ts,.js}')],
  migrations: [path.resolve(__dirname, 'src/common/database/migrations/*.ts')],
  cli: {
    migrationsDir: path.resolve(__dirname, 'src/common/database/migrations'),
  },
  uuidExtension: 'uuid-ossp',
};
