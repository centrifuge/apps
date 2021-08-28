import { Injectable } from '@nestjs/common'
import { Tranche } from 'src/controllers/types'
import { uuidv4 } from '../utils/uuid'
import { DatabaseService } from './db.service'
import { KycEntity } from './kyc.repo'

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
      from addresses
      inner join users on users.id = addresses.user_id
      where addresses.address = ${address}
    `

    return data as User | undefined
  }

  async getWithKycAndAgreement(poolId: string): Promise<UserWithKyc[]> {
    const data = await this.db.sql`
      select users.*, kyc.provider, kyc.provider_account_id, kyc.created_at, kyc.status, kyc.usa_tax_resident, kyc.accredited
      from users
      left join kyc on kyc.user_id = users.id
      inner join user_pools on user_pools.user_id = users.id and user_pools.pool_id = ${poolId}
      group by users.id, kyc.user_id, kyc.provider, kyc.provider_account_id, kyc.digest, kyc.created_at, kyc.status, kyc.usa_tax_resident, kyc.accredited
    `

    return data as unknown as UserWithKyc[]
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
    const prevUser = await this.find(userId)

    // We make sure a field cannot set to blank after it's already been set once, it can only be updated
    const [updatedUser] = await this.db.sql`
      update users
      set email = ${email?.length > 0 ? email : prevUser.email},
      country_code = ${countryCode?.length > 0 ? countryCode : prevUser.countryCode},
      full_name = ${fullName?.length > 0 ? fullName : prevUser.fullName},
      entity_name = ${entityName?.length > 0 ? entityName : prevUser.entityName}
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
  entityName?: string
  countryCode?: string
}

export type UserPool = {
  userId: string
  poolId: string
  tranche: Tranche
  createdAt: Date
}

export type UserWithKyc = Omit<KycEntity, 'digest'> & User
