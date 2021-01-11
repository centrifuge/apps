import { Injectable } from '@nestjs/common'
import { uuidv4 } from '../utils/uuid'
import { DatabaseService } from './db.service'

export type User = {
  id: string
  email?: string
  fullName?: string
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

  async findByAddress(address: string): Promise<User | undefined> {
    const [data] = await this.db.sql`
    select users.*
    from users
    inner join addresses on addresses.address = ${address}
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

  async delete(address: string, blockchain: string, network: string): Promise<boolean> {
    await this.db.sql`
      delete from users
      where users.id IN (
        select addresses.user_id
        from addresses
        where addresses.blockchain = ${blockchain}
        and addresses.network = ${network}
        and addresses.address = ${address}
      )`

    return true
  }
}
