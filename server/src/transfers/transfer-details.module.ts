import { Module } from "@nestjs/common";
import { TransferDetailsController } from "./transfer-details.controller";
import { DatabaseModule } from "../database/database.module";
import { AuthModule } from "../auth/auth.module";
import { CentrifugeModule } from "../centrifuge-client/centrifuge.module";
import { EthModule } from "../eth/eth.module";

@Module({
  controllers: [TransferDetailsController],
  imports: [DatabaseModule, AuthModule, CentrifugeModule, EthModule],
})
export class TransferModule {}