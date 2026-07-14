import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'whatsapp_triage'),
        ssl: configService.get('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
        entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
        synchronize: configService.get('DB_SYNC', 'false') === 'true',
        logging: configService.get('DB_LOGGING', 'true') === 'true',
        // Enable UUID support
        uuidExtension: 'uuid-ossp',
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
