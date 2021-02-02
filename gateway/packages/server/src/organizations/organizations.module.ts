import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module'
import { OrganizationsController } from './organizations.controller'

@Module({
  controllers: [OrganizationsController],
  imports: [DatabaseModule],
})
export class OrganizationsModule {}
