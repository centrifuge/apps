import { Module } from '@nestjs/common';
import { EthService } from './eth.service';

@Module({
  providers: [EthService],
  exports: [EthService],
})
export class EthModule {}
