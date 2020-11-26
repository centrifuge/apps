import { Injectable } from '@nestjs/common'

import { uuidv4 } from '../utils/uuid'
import { DatabaseService } from './db.service'

export type User = {
  id: string
  email?: string
}

@Injectable()
export class UserRepo {
  constructor(private readonly db: DatabaseService) {}

  async create(): Promise<User | undefined> {
    const id = uuidv4()

    const [user] = await this.db.sql`
      insert into users (
        id
      ) values (
        ${id}
      )

      returning *
    `

    return user as User | undefined
  }

  async setEmail(userId: string, email: string): Promise<User | undefined> {
    const [updatedUser] = await this.db.sql`
      update users
      set email = ${email}
      where id = ${userId}

      returning *
    `

    return updatedUser as User | undefined
  }
}
