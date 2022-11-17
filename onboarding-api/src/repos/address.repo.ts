import { Injectable } from '@nestjs/common'
import { Tranche } from 'src/controllers/types'
import { uuidv4 } from '../utils/uuid'
import { DatabaseService } from './db.service'
import { UserRepo } from './user.repo'

@Injectable()
export class AddressRepo {
  constructor(private readonly db: DatabaseService, private readonly userRepo: UserRepo) {}

  async find(blockchain: Blockchain, network: Network, address: string): Promise<AddressEntity | undefined> {
    const [data] = await this.db.sql`
      select *
      from addresses
      where addresses.blockchain = ${blockchain}
      and addresses.network = ${network}
      and lower(addresses.address) = ${address.toLowerCase()}
    `

    return data as AddressEntity | undefined
  }

  async getByUser(userId: string): Promise<AddressEntity[]> {
    const data = await this.db.sql`
      select *
      from addresses
      where addresses.user_id = ${userId}
      and addresses.unlinked_at is null
    `

    if (!data) return []

    return data as unknown as AddressEntity[]
  }

  // Gets the list of users which should have been whitelisted, but arent
  async getMissingWhitelistedUsers(): Promise<{ userId: string; poolId: string; tranche: Tranche }[]> {
    const data = await this.db.sql`
      select users.id as user_id, agreements.pool_id, agreements.tranche, count(addresses.id) as address_count
      from addresses
      right join users on users.id = addresses.user_id
      right join kyc on kyc.user_id = users.id
      right join agreements on agreements.user_id = users.id
      left join investments on investments.address_id = addresses.id and investments.pool_id = agreements.pool_id and investments.tranche = agreements.tranche
      where kyc.status like 'verified' and (kyc.usa_tax_resident is false or kyc.accredited is true)
      and agreements.signed_at is not null and agreements.counter_signed_at is not null
      and investments.is_whitelisted is not true
      group by users.id, agreements.pool_id, agreements.tranche
    `

    if (!data) return []

    const investors = data as unknown as { userId: string; poolId: string; tranche: Tranche; addressCount: number }[]
    return investors.filter((investor) => investor.addressCount > 0)
  }

  async findOrCreate(blockchain: Blockchain, network: Network, address: string): Promise<AddressEntity> {
    const [data] = await this.db.sql`
      select *
      from addresses
      where addresses.blockchain = ${blockchain}
      and addresses.network = ${network}
      and lower(addresses.address) = ${address.toLowerCase()}
    `

    if (!data) {
      const user = await this.userRepo.create()
      const id = uuidv4()

      const [newAddress] = await this.db.sql`
        insert into addresses (
          id, user_id, blockchain, network, address
        ) values (
          ${[id, user.id, blockchain, network, address]}
        )

        returning *
      `

      return newAddress as AddressEntity
    }

    return data as AddressEntity
  }

  async linkToNewUser(addressId: string, newUserId: string): Promise<AddressEntity | undefined> {
    const [updatedAddress] = await this.db.sql`
      update addresses
      set user_id = ${newUserId}
      where addresses.id = ${addressId}

      returning *
    `

    return updatedAddress as AddressEntity | undefined
  }

  async unlink(userId: string, address: string): Promise<AddressEntity | undefined> {
    const [updatedAddress] = await this.db.sql`
      update addresses
      set unlinked_at = now()
      where addresses.address = ${address}
      and addresses.user_id = ${userId}

      returning *
    `

    return updatedAddress as AddressEntity | undefined
  }
}

export type Blockchain = 'ethereum'
export type Network = 'mainnet' | 'goerli'

export type AddressEntity = {
  id: string
  userId: string
  blockchain: Blockchain
  network: Network
  address: string
  createdAt: Date
  unlinkedAt?: Date
}
