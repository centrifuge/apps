import { Injectable } from '@nestjs/common'
import { AgreementsStatus, Tranche } from '../controllers/types'
import { DocusignService } from '../services/docusign.service'
import { uuidv4 } from '../utils/uuid'
import { DatabaseService } from './db.service'

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

    return agreements as unknown as Agreement[]
  }

  async getByUserIds(userIds: string[]): Promise<Agreement[]> {
    if (userIds.length === 0) return []

    const agreements = await this.db.sql`
      select *
      from agreements
      where agreements.user_id in (${userIds})
    `

    return agreements as unknown as Agreement[]
  }

  async getByUserPoolTranche(userId: string, poolId: string, tranche: Tranche): Promise<Agreement[]> {
    const agreements = await this.db.sql`
      select *
      from agreements
      where agreements.user_id = ${userId}
      and lower(agreements.pool_id) = ${poolId.toLowerCase()}
      and agreements.tranche = ${tranche}
    `

    return agreements as unknown as Agreement[]
  }

  async getCompletedAgreementsByUserPool(userId: string, poolId: string): Promise<Agreement[]> {
    const agreements = await this.db.sql`
      select *
      from agreements
      where user_id = ${userId}
      and lower(agreements.pool_id) = ${poolId.toLowerCase()}
      and signed_at is not null
      and counter_signed_at is not null
    `

    return agreements as unknown as Agreement[]
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
    // If the agreement was declined or voided, we should not return it here,
    // which causes a new one to be created.
    const [existingAgreement] = await this.db.sql`
      select *
      from agreements
      where agreements.user_id = ${userId}
      and lower(agreements.pool_id) = ${poolId.toLowerCase()}
      and agreements.tranche = ${tranche}
      and agreements.provider_template_id = ${templateId}
      and agreements.declined_at is null
      and agreements.voided_at is null
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

  async setDeclined(agreementId: string): Promise<Agreement | undefined> {
    const [updatedAgreement] = await this.db.sql`
      update agreements
      set declined_at = now()
      where id = ${agreementId}

      returning *
    `

    return updatedAgreement as Agreement | undefined
  }

  async setVoided(agreementId: string): Promise<Agreement | undefined> {
    const [updatedAgreement] = await this.db.sql`
      update agreements
      set voided_at = now()
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

    return agreements as unknown as Agreement[]
  }

  async getStatusForProfileAgreements(
    userId: string,
    poolId: string,
    profileAgreements: AgreementsStatus[]
  ): Promise<AgreementsStatus[]> {
    let agreements = profileAgreements.reduce((prev: {}, profileAgreement: Agreement) => {
      return { ...prev, [profileAgreement.providerTemplateId]: profileAgreement }
    }, {})

    const dbAgreements = await this.db.sql`
      select *
      from agreements
      where agreements.user_id = ${userId}
      and lower(agreements.pool_id) = ${poolId.toLowerCase()}
      and agreements.provider = 'docusign'
      and agreements.provider_template_id in (${profileAgreements.map((pa) => pa.providerTemplateId)})
    `

    dbAgreements.forEach((dbAgreement: Agreement) => {
      agreements[dbAgreement.providerTemplateId].signed = !!dbAgreement.signedAt
      agreements[dbAgreement.providerTemplateId].counterSigned = !!dbAgreement.counterSignedAt
      agreements[dbAgreement.providerTemplateId].declined = !!dbAgreement.declinedAt
      agreements[dbAgreement.providerTemplateId].voided = !!dbAgreement.voidedAt
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
  declinedAt?: Date
  voidedAt?: Date
}
