import { Injectable } from '@nestjs/common'
import { DatabaseService } from './db.service'
import { UserRepo } from './user.repo'

export type Blockchain = 'ethereum'
export type Network = 'mainnet' | 'kovan'

export type Address = {
  userId: string
  blockchain: Blockchain
  network: Network
  address: string
  createdAt: Date
}

@Injectable()
export class AddressRepo {
  constructor(private readonly db: DatabaseService, private readonly userRepo: UserRepo) {}

  async find(address: string): Promise<Address | undefined> {
    const [data] = await this.db.sql`
      select *
      from addresses
      where lower(addresses.address) = ${address.toLowerCase()}
    `

    return data as Address | undefined
  }

  async findOrCreate(blockchain: Blockchain, network: Network, address: string): Promise<Address> {
    const [data] = await this.db.sql`
      select *
      from addresses
      where addresses.blockchain = ${blockchain}
      and addresses.network = ${network}
      and lower(addresses.address) = ${address.toLowerCase()}
    `

    if (!data) {
      const user = await this.userRepo.create()

      const [newAddress] = await this.db.sql`
        insert into addresses (
          user_id, blockchain, network, address
        ) values (
          ${[user.id, blockchain, network, address]}
        )

        returning *
      `

      return newAddress as Address
    }

    return data as Address
  }

  // TODO: addAddressForExistingUser(user: User, blockchain: Blockchain, network: Network, address: string)
}
