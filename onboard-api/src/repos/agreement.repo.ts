import { Injectable } from '@nestjs/common'
import { PoolService, ProfileAgreement } from '../services/pool.service'
import { Tranche } from '../controllers/types'
import { DocusignService } from '../services/docusign.service'
import { uuidv4 } from '../utils/uuid'
import { DatabaseService } from './db.service'

@Injectable()
export class AgreementRepo {
  constructor(
    private readonly db: DatabaseService,
    private readonly docusignService: DocusignService,
    private readonly poolService: PoolService
  ) {}

  async find(id: string): Promise<Agreement | undefined> {
    const [agreement] = await this.db.sql`
      select *
      from agreements
      where agreements.id = ${id}
    `

    return agreement as Agreement | undefined
  }

  async findByUser(userId: string): Promise<Agreement[]> {
    const agreements = await this.db.sql`
      select *
      from agreements
      where agreements.user_id = ${userId}
    `

    return (agreements as unknown) as Agreement[]
  }

  async findByUserPoolTranche(userId: string, poolId: string, tranche: Tranche): Promise<Agreement[]> {
    const agreements = await this.db.sql`
      select *
      from agreements
      where agreements.user_id = ${userId}
      and agreements.pool_id = ${poolId}
      and agreements.tranche = ${tranche}
    `

    return (agreements as unknown) as Agreement[]
  }

  async findByUserAndPool(userId: string, poolId: string, email: string, countryCode: string): Promise<Agreement[]> {
    const agreements = await this.db.sql`
      select *
      from agreements
      where agreements.user_id = ${userId}
      and agreements.pool_id = ${poolId}
    `

    if (agreements.length === 0) {
      return await this.createAgreementsForPool(poolId, userId, email, countryCode)
    }

    return (agreements as unknown) as Agreement[]
  }

  async findOrCreate(
    userId: string,
    email: string,
    poolId: string,
    tranche: Tranche,
    name: string,
    templateId: string
  ): Promise<Agreement> {
    const [existingAgreement] = await this.db.sql`
      select *
      from agreements
      where agreements.user_id = ${userId}
      and agreements.pool_id = ${poolId}
      and agreements.tranche = ${tranche}
      and agreements.provider_template_id = ${templateId}
    `

    if (!existingAgreement) {
      const id = uuidv4()
      const envelopeId = await this.docusignService.createAgreement(poolId, userId, email, templateId)

      const [newAgreement] = await this.db.sql`
        insert into agreements (
          id, user_id, pool_id, tranche, name, provider, provider_template_id, provider_envelope_id
        ) values (
          ${[id, userId, poolId, tranche, name, 'docusign', templateId, envelopeId]}
        )

        returning *
      `
      return newAgreement as Agreement
    }

    return existingAgreement as Agreement
  }

  // Find or create the relevant agreement for this pool
  // TODO: templateId should be based on the agreement required for the pool
  // TODO: if US, then a, else b
  async createAgreementsForPool(
    poolId: string,
    userId: string,
    email: string,
    countryCode: string
  ): Promise<Agreement[]> {
    const pool = await this.poolService.get(poolId)
    if (!pool) throw new Error(`Cannot create agreements for pool ${poolId}`)

    let agreements = []

    await pool.profile.agreements.forEach(async (profileAgreement: ProfileAgreement) => {
      console.log({ userId, email, poolId, countryCode })

      if (
        (countryCode === 'US' && profileAgreement.country === 'non-us') ||
        (countryCode !== 'US' && profileAgreement.country === 'us')
      )
        return

      try {
        const agreement = await this.findOrCreate(
          userId,
          email,
          poolId,
          profileAgreement.tranche,
          profileAgreement.name,
          profileAgreement.providerTemplateId
        )
        agreements.push(agreement)
      } catch (e) {
        console.error(e)
      }
    })

    return agreements
  }

  async setSigned(agreementId: string): Promise<Agreement | undefined> {
    const [updatedAgreement] = await this.db.sql`
      update agreements
      set signed_at = now()
      where id = ${agreementId}

      returning *
    `

    return updatedAgreement as Agreement | undefined
  }

  async setCounterSigned(agreementId: string): Promise<Agreement | undefined> {
    const [updatedAgreement] = await this.db.sql`
      update agreements
      set counter_signed_at = now()
      where id = ${agreementId}

      returning *
    `

    return updatedAgreement as Agreement | undefined
  }

  async getAwaitingCounterSignature(): Promise<Agreement[]> {
    const agreements = await this.db.sql`
      select *
      from agreements
      where agreements.signed_at is not null
      and agreements.counter_signed_at is null
    `

    if (!agreements) return []

    return (agreements as unknown) as Agreement[]
  }
}

export type Agreement = {
  id: string
  userId: string
  poolId: string
  tranche: Tranche
  name: string
  provider: 'docusign'
  providerEnvelopeId: string
  signedAt: Date
  counterSignedAt: Date
}
