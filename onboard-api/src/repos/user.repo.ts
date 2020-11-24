import { Injectable } from '@nestjs/common'

import { DatabaseService } from './db.service'

@Injectable()
export class UserRepo {
  constructor(private readonly db: DatabaseService) {}
}
