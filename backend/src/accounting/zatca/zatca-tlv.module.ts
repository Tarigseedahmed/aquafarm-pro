import { Module } from '@nestjs/common';
import { ZATCATLVService } from './zatca-tlv.service';
import { ZATCATLVController } from './zatca-tlv.controller';

@Module({
  providers: [ZATCATLVService],
  controllers: [ZATCATLVController],
  exports: [ZATCATLVService],
})
export class ZATCATLVModule {}
