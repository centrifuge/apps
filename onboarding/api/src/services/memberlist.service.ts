import { Injectable, Logger } from '@nestjs/common'
import { Tranche } from 'src/controllers/types'
import { Agreement, AgreementRepo } from '../repos/agreement.repo'
import { KycRepo } from '../repos/kyc.repo'
import { PoolService } from './pool.service'

@Injectable()
export class MemberlistService {
  private readonly logger = new Logger(MemberlistService.name)

  constructor(
    private readonly kycRepo: KycRepo,
    private readonly agreementRepo: AgreementRepo,
    private readonly poolService: PoolService
  ) {}

  async update(userId, poolId?: string, tranche?: Tranche) {
    const kyc = await this.kycRepo.find(userId)
    if (kyc.status !== 'verified' || (kyc.usaTaxResident && !kyc.accredited)) return

    // If tranche is supplied, whitelist just for that tranche. Otherwise, try to whitelist for both
    let tranches = []
    if (tranche === undefined) {
      const agreements = await this.agreementRepo.getCompletedAgreementsByUserPool(userId, poolId)
      tranches = agreements.map((agreement: Agreement) => agreement.tranche)
    } else {
      tranches = [tranche]
    }

    tranches.forEach(async (t: Tranche) => {
      // If poolId is supplied, whitelist just for that pool. Otherwise, try to whitelist for all pools
      const poolIds = poolId === undefined ? await this.poolService.getIds() : [poolId]

      poolIds.forEach(async (poolId: string) => {
        const agreements = await this.agreementRepo.getByUserPoolTranche(userId, poolId, t)
        const done = agreements.every((agreement: Agreement) => agreement.signedAt && agreement.counterSignedAt)
        if (done) {
          this.poolService.addToMemberlist(userId, poolId, t)
        }
      })
    })
  }
}
