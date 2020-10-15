import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  controllers: [OrganizationsController],
  imports: [DatabaseModule],

})
export class OrganizationsModule {}
