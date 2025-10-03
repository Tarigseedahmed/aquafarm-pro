/**
 * AquaFarm Pro - Test Configuration
 * Simple configuration to test the application without database setup
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Simple in-memory configuration for testing
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
})
export class TestConfigModule {}

// Mock database configuration for testing
export const testDatabaseConfig = {
  synchronize: true, // Only for testing - creates tables automatically
  logging: true,
  entities: ['dist/**/*.entity{.ts,.js}'],
  type: 'sqlite' as const,
  database: ':memory:', // In-memory SQLite for testing
};
