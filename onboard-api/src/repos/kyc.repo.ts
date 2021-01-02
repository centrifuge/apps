import { Injectable } from '@nestjs/common'
import { DatabaseService } from './db.service'

export type Blockchain = 'ethereum'
export type Network = 'mainnet' | 'kovan'

export interface KycEntity {
  userId: string
  provider: string
  providerAccountId: string
  poolId?: string
  digest: SecuritizeDigest
  createdAt?: Date
  verifiedAt?: Date
  status: 'none' | 'processing' | 'updates-required' | 'verified' | 'manual-review' | 'rejected' | 'expired'
}

export interface SecuritizeDigest {
  accessToken: string
  refreshToken: string
  expiration: string
}

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

  async getProcessingInvestors(): Promise<KycEntity[]> {
    const investors = await this.db.sql`
      select *
      from kyc
      where kyc.created_at is not null
      and kyc.verified_at is null
    `

    if (!investors) return []

    return (investors as unknown) as KycEntity[]
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
          update set digest = ${JSON.stringify(digest)}

      returning *
    `

    return newKyc as KycEntity | undefined
  }
}
