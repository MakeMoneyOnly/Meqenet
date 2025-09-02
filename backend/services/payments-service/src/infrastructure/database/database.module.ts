import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Constants for database configuration - FinTech compliance
const DEFAULT_POSTGRES_PORT = 5432;

/**
 * Database Module - Enterprise FinTech compliant database configuration
 * Uses TypeORM with PostgreSQL for ACID compliance and transaction safety
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', DEFAULT_POSTGRES_PORT),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME', 'payments_db'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: true,
        synchronize: configService.get<string>('NODE_ENV') === 'development', // Never true in production
        logging: configService.get<string>('NODE_ENV') === 'development',
        ssl: configService.get<string>('NODE_ENV') === 'production',
        extra: {
          // Connection pool settings for FinTech workloads
          max: 20, // Maximum connections
          min: 5, // Minimum connections
          idleTimeoutMillis: 30000,
          acquireTimeoutMillis: 60000,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
