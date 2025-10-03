import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EGSConnectorService } from './egs-connector.service';
import { EGSConnectorController } from './egs-connector.controller';

@Module({
  imports: [ConfigModule],
  providers: [EGSConnectorService],
  controllers: [EGSConnectorController],
  exports: [EGSConnectorService],
})
export class EGSConnectorModule {}
