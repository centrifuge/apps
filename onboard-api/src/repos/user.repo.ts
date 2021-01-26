import { Injectable } from '@nestjs/common'
import { Tranche } from 'src/controllers/types'
import { uuidv4 } from '../utils/uuid'
import { DatabaseService } from './db.service'

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

  async linkToPool(userId: string, poolId: string, tranche: 'senior' | 'junior'): Promise<UserPool | undefined> {
    const [user] = await this.db.sql`
      insert into user_pools (
        user_id,
        pool_id,
        tranche
      ) values (
        ${userId},
        ${poolId},
        ${tranche}
      )

      returning *
    `

    return user as UserPool | undefined
  }

  async update(
    userId: string,
    email: string,
    countryCode: string,
    fullName?: string,
    entityName?: string
  ): Promise<User | undefined> {
    const [updatedUser] = await this.db.sql`
      update users
      set email = ${email},
      country_code = ${countryCode},
      full_name = ${fullName || ''},
      entity_name = ${entityName || ''}
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

export type User = {
  id: string
  email?: string
  fullName?: string
  countryCode?: string
}

export type UserPool = {
  userId: string
  poolId: string
  tranche: Tranche
  createdAt: Date
}
