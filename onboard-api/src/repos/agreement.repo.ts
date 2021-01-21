import { Injectable } from '@nestjs/common'
import { AgreementsStatus, Tranche } from '../controllers/types'
import { DocusignService } from '../services/docusign.service'
import { PoolService, ProfileAgreement } from '../services/pool.service'
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

  async findByProvider(provider: 'docusign', providerEnvelopeId: string): Promise<Agreement | undefined> {
    const [agreement] = await this.db.sql`
      select *
      from agreements
      where agreements.provider = ${provider}
      and agreements.provider_envelope_id = ${providerEnvelopeId}
    `

    return agreement as Agreement | undefined
  }

  async findByProviderAndTemplateId(provider: 'docusign', providerTemplateId: string): Promise<Agreement | undefined> {
    const [agreement] = await this.db.sql`
      select *
      from agreements
      where agreements.provider = ${provider}
      and agreements.provider_template_id = ${providerTemplateId}
    `

    return agreement as Agreement | undefined
  }

  async getByUser(userId: string): Promise<Agreement[]> {
    const agreements = await this.db.sql`
      select *
      from agreements
      where agreements.user_id = ${userId}
    `

    return (agreements as unknown) as Agreement[]
  }

  async getByUserPoolTranche(userId: string, poolId: string, tranche: Tranche): Promise<Agreement[]> {
    const agreements = await this.db.sql`
      select *
      from agreements
      where agreements.user_id = ${userId}
      and agreements.pool_id = ${poolId}
      and agreements.tranche = ${tranche}
    `

    return (agreements as unknown) as Agreement[]
  }

  async getCompletedAgreementsByUserPool(userId: string, poolId: string): Promise<Agreement[]> {
    const agreements = await this.db.sql`
      select *
      from agreements
      where user_id = ${userId}
      and pool_id = ${poolId}
      and signed_at is not null
      and counter_signed_at is not null
    `

    return (agreements as unknown) as Agreement[]
  }

  async getByUserAndPool(userId: string, poolId: string, email: string, countryCode: string): Promise<Agreement[]> {
    const agreements = await this.db.sql`
      select *
      from agreements
      where agreements.user_id = ${userId}
      and agreements.pool_id = ${poolId}
    `

    // if (agreements.length === 0) {
    //   return await this.createAgreementsForPool(poolId, userId, email, countryCode)
    // }

    return (agreements as unknown) as Agreement[]
  }

  async findOrCreate(
    userId: string,
    email: string,
    fullName: string,
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
      const envelopeId = await this.docusignService.createAgreement(poolId, userId, fullName, email, templateId)

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
  // async createAgreementsForPool(
  //   poolId: string,
  //   userId: string,
  //   email: string,
  //   countryCode: string
  // ): Promise<Agreement[]> {
  //   const pool = await this.poolService.get(poolId)
  //   if (!pool) throw new Error(`Cannot create agreements for pool ${poolId}`)

  //   const agreements = await Promise.all(
  //     pool.profile.agreements.map(async (profileAgreement: ProfileAgreement) => {
  //       if (
  //         (countryCode === 'US' && profileAgreement.country === 'non-us') ||
  //         (countryCode !== 'US' && profileAgreement.country === 'us')
  //       )
  //         return

  //       try {
  //         return await this.findOrCreate(
  //           userId,
  //           email,
  //           poolId,
  //           profileAgreement.tranche,
  //           profileAgreement.name,
  //           profileAgreement.providerTemplateId
  //         )
  //       } catch (e) {
  //         console.error(e)
  //       }
  //     })
  //   )

  //   return agreements
  // }

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

  async getStatusForProfileAgreements(profileAgreements: AgreementsStatus[]): Promise<AgreementsStatus[]> {
    let agreements = profileAgreements.reduce((prev: {}, profileAgreement: Agreement) => {
      return { ...prev, [profileAgreement.providerTemplateId]: profileAgreement }
    }, {})

    const dbAgreements = await this.db.sql`
      select *
      from agreements
      where agreements.provider = 'docusign'
      and agreements.provider_template_id in (${profileAgreements.map((pa) => pa.providerTemplateId)})
    `
    dbAgreements.forEach((dbAgreement: Agreement) => {
      agreements[dbAgreement.providerTemplateId].signed = dbAgreement.signedAt !== undefined
      agreements[dbAgreement.providerTemplateId].counterSigned = dbAgreement.counterSignedAt !== undefined
    })

    return Object.values(agreements)
  }
}

export type Agreement = {
  id: string
  userId: string
  poolId: string
  tranche: Tranche
  name: string
  provider: 'docusign'
  providerTemplateId: string
  providerEnvelopeId: string
  signedAt: Date
  counterSignedAt: Date
}
