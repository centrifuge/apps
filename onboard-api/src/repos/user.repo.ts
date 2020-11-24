import { Injectable } from '@nestjs/common'

import { DatabaseService } from './db.service'

export type User = {
  id: string
  email?: string
}

@Injectable()
export class UserRepo {
  constructor(private readonly db: DatabaseService) {}

  async getByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.sql`
      select *
      from users
      where users.email = ${email}
    `

    return user as User | undefined
  }
}
