import { DatabaseModule } from "../database/database.module";
import { AuthModule } from "../auth/auth.module";
import { CentrifugeModule } from "../centrifuge-client/centrifuge.module";
import { DocumentsController } from "./documents.controller";
import { Module } from "@nestjs/common";

@Module({
  controllers: [DocumentsController],
  providers: [],
  imports: [DatabaseModule, AuthModule, CentrifugeModule]
})

export class DocumentsModule {}