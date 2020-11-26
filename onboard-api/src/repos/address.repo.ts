import { Injectable } from '@nestjs/common'

import { DatabaseService } from './db.service'

export type Blockchain = 'ethereum'
export type Network = 'mainnet' | 'kovan'

export type Address = {
  id: string
  email?: string
}

@Injectable()
export class AddressRepo {
  constructor(private readonly db: DatabaseService) {}

  async find(blockchain: Blockchain, network: Network, address: string): Promise<Address | undefined> {
    const [data] = await this.db.sql`
      select *
      from addresses
      where addresses.blockchain = ${blockchain}
      and addresses.network = ${network}
      and addresses.address = ${address}
    `

    return data as Address | undefined
  }
}
