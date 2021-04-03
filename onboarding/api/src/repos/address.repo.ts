import { Injectable } from '@nestjs/common'
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
    `

    if (!data) return []

    return (data as unknown) as AddressEntity[]
  }

  async getByUserIds(userIds: string[]): Promise<AddressEntity[]> {
    if (userIds.length === 0) return []

    const agreements = await this.db.sql`
      select *
      from addresses
      where addresses.user_id in (${userIds})
    `

    return (agreements as unknown) as AddressEntity[]
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
}

export type Blockchain = 'ethereum'
export type Network = 'mainnet' | 'kovan'

export type AddressEntity = {
  id: string
  userId: string
  blockchain: Blockchain
  network: Network
  address: string
  createdAt: Date
}
