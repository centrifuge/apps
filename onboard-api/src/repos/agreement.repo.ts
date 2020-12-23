import { Injectable } from '@nestjs/common'
import { DocusignService } from '../services/docusign.service'
import { uuidv4 } from '../utils/uuid'
import { DatabaseService } from './db.service'
import config from '../config'

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

export type Tranche = 'senior' | 'junior'

@Injectable()
export class AgreementRepo {
  constructor(private readonly db: DatabaseService, private readonly docusignService: DocusignService) {}

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

  async findByUserAndPool(userId: string, poolId: string, email: string): Promise<Agreement[]> {
    const agreements = await this.db.sql`
      select *
      from agreements
      where agreements.user_id = ${userId}
      and agreements.pool_id = ${poolId}
    `

    if (agreements.length === 0) {
      console.log('no agreements', agreements)
      return await this.createAgreementsForPool(poolId, userId, email)
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
      const envelopeId = await this.docusignService.createAgreement(userId, email, templateId)

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
  async createAgreementsForPool(poolId: string, userId: string, email: string): Promise<Agreement[]> {
    let agreements = []
    const tranches = ['senior', 'junior']

    await tranches.forEach(async (tranche: Tranche) => {
      console.log({ userId, email, poolId, tranche })
      try {
        const agreement = await this.findOrCreate(
          userId,
          email,
          poolId,
          tranche,
          `${tranche === 'senior' ? 'DROP' : 'TIN'} Subscription Agreement`,
          config.docusign.templateId
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
}
