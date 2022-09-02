import { Injectable } from '@nestjs/common'
import { KycStatusLabel } from 'src/controllers/types'
import { DatabaseService } from './db.service'

@Injectable()
export class KycRepo {
  constructor(private readonly db: DatabaseService) {}

  // Note: this currently assumes there's a single KYC entity per user
  async find(userId: string): Promise<KycEntity | undefined> {
    const [data] = await this.db.sql`
      select *
      from kyc
      where kyc.user_id = ${userId}
    `

    return data as KycEntity | undefined
  }

  async findByProvider(provider: 'securitize', providerAccountId: string): Promise<KycEntity | undefined> {
    const [data] = await this.db.sql`
      select *
      from kyc
      where kyc.provider = ${provider}
      and kyc.provider_account_id = ${providerAccountId}
    `

    return data as KycEntity | undefined
  }

  async getProcessingInvestors(): Promise<KycEntity[]> {
    const investors = await this.db.sql`
      select *
      from kyc
      where kyc.created_at is not null
      and (kyc.status != 'verified'
      or (kyc.usa_tax_resident = TRUE and kyc.accredited = FALSE))
      and kyc.invalidated_at is null
    `
    if (!investors) return []

    return investors as unknown as KycEntity[]
  }

  async upsertSecuritize(
    userId: string,
    providerAccountId: string,
    digest: SecuritizeDigest
  ): Promise<KycEntity | undefined> {
    const [newKyc] = await this.db.sql`
      insert into kyc (
        user_id, provider, provider_account_id, digest
      ) values (
        ${[userId, 'securitize', providerAccountId, JSON.stringify(digest)]}
      )
      on conflict (user_id, provider, provider_account_id)
        do
          update set digest = ${JSON.stringify(digest)}, invalidated_at = null

      returning *
    `

    return newKyc as KycEntity | undefined
  }

  async setStatus(
    provider: string,
    providerAccountId: string,
    status: KycStatusLabel,
    usaTaxResident?: boolean,
    accredited?: boolean
  ): Promise<KycEntity | undefined> {
    const [updatedKyc] = await this.db.sql`
      update kyc
      set status = ${status},
      usa_tax_resident = ${usaTaxResident === undefined ? false : usaTaxResident},
      accredited = ${accredited === undefined ? false : accredited}
      where provider = ${provider}
      and provider_account_id = ${providerAccountId}

      returning *
    `

    return updatedKyc as KycEntity | undefined
  }

  async invalidate(provider: string, providerAccountId: string): Promise<KycEntity | undefined> {
    const [updatedKyc] = await this.db.sql`
      update kyc
      set invalidated_at = now()
      where provider = ${provider}
      and provider_account_id = ${providerAccountId}

      returning *
    `

    return updatedKyc as KycEntity | undefined
  }
}

export type Blockchain = 'ethereum'
export type Network = 'mainnet' | 'goerli'
export interface KycEntity {
  userId: string
  provider: string
  providerAccountId: string
  poolId?: string
  digest: SecuritizeDigest
  createdAt?: Date
  status: KycStatusLabel
  accredited: boolean
  usaTaxResident: boolean
  invalidatedAt?: boolean
}

export interface SecuritizeDigest {
  accessToken: string
  refreshToken: string
  expiration: string
}
