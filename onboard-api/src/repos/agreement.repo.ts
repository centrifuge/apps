import { Injectable } from '@nestjs/common'
import { DocusignService } from '../services/docusign.service'
import { uuidv4 } from '../utils/uuid'
import { DatabaseService } from './db.service'

export type Agreement = {
  id: string
  userId: string
  poolId: string
  provider: 'docusign'
  providerEnvelopeId: string
  signedAt: Date
  counterSignedAt: Date
}

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

  async findOrCreate(userId: string, email: string, templateId: string): Promise<Agreement> {
    const [existingAgreement] = await this.db.sql`
      select *
      from agreements
      where agreements.user_id = ${userId}
      and agreements.provider_template_id = ${templateId}
    `

    if (!existingAgreement) {
      const id = uuidv4()
      const envelopeId = await this.docusignService.createAgreement(userId, email, templateId)

      const [newAgreement] = await this.db.sql`
        insert into agreements (
          id, user_id, provider, provider_template_id, provider_envelope_id
        ) values (
          ${[id, userId, 'docusign', templateId, envelopeId]}
        )

        returning *
      `
      return newAgreement as Agreement
    }

    return existingAgreement as Agreement
  }
}
