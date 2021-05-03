import { Injectable } from '@nestjs/common'
import { uuidv4 } from 'src/utils/uuid'
import { Tranche } from '../controllers/types'
import { DatabaseService } from './db.service'

@Injectable()
export class InvestmentRepo {
  constructor(private readonly db: DatabaseService) {}

  async find(addressId: string, poolId: string, tranche: Tranche): Promise<InvestmentEntity | undefined> {
    const [data] = await this.db.sql`
      select *
      from investments
      where investments.address_id = ${addressId}
      and investments.pool_id = ${poolId}
      and investments.tranche = ${tranche}
    `

    return data as InvestmentEntity | undefined
  }

  async getWhitelistStatus(addressId: string, poolId: string): Promise<{ [key in Tranche]: boolean }> {
    const data = await this.db.sql`
      select *
      from investments
      where investments.address_id = ${addressId}
      and investments.pool_id = ${poolId}
    `

    let isWhitelisted = { senior: false, junior: false }
    data.forEach((row: InvestmentEntity) => {
      if (row.isWhitelisted) {
        isWhitelisted[row.tranche] = true
      }
    })

    return isWhitelisted
  }

  async upsert(
    addressId: string,
    poolId: string,
    tranche: Tranche,
    isWhitelisted: boolean,
    agreementId: string,
    investorName: string
  ): Promise<InvestmentEntity | undefined> {
    const [newInvestment] = await this.db.sql`
      insert into investments (
        id, address_id, pool_id, tranche, is_whitelisted, agreement_id, investor_name, updated_at
      ) values (
        ${[uuidv4(), addressId, poolId, tranche, isWhitelisted, agreementId, investorName, new Date()]}
      )
      on conflict (address_id, pool_id, tranche) 
        do 
          update set is_whitelisted = ${isWhitelisted},
          updated_at = ${new Date()}

      returning *
    `

    return newInvestment as InvestmentEntity | undefined
  }
}

export interface InvestmentEntity {
  id: string
  addressId: string
  poolId: string
  tranche: Tranche
  isWhitelisted: boolean
  balance: number
  updatedAt: Date
  // The two rows below are intentionally redundant, they are there to ensure that we always know which address
  // is linked to which investor, either through the agreement or just by knowing their name.
  agreementId?: string
  investorName?: string
}
