import { Injectable } from '@nestjs/common'
import { uuidv4 } from '../utils/uuid'
import { DatabaseService } from './db.service'

export type User = {
  id: string
  email?: string
  countryCode?: string
}

@Injectable()
export class UserRepo {
  constructor(private readonly db: DatabaseService) {}

  async find(userId: string): Promise<User | undefined> {
    const [data] = await this.db.sql`
      select *
      from users
      where users.id = ${userId}
    `

    return data as User | undefined
  }

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

  async update(userId: string, email: string, fullName: string, countryCode: string): Promise<User | undefined> {
    const [updatedUser] = await this.db.sql`
      update users
      set email = ${email},
      full_name = ${fullName},
      country_code = ${countryCode}
      where id = ${userId}

      returning *
    `

    return updatedUser as User | undefined
  }
}
