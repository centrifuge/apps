import { Injectable, Logger } from '@nestjs/common'
import { Tranche } from '../controllers/types'
import { UserRepo } from '../repos/user.repo'
import { Agreement, AgreementRepo } from '../repos/agreement.repo'
import { KycRepo } from '../repos/kyc.repo'
import { PoolService } from './pool.service'
import config from '../config'

@Injectable()
export class MemberlistService {
  private readonly logger = new Logger(MemberlistService.name)

  constructor(
    private readonly userRepo: UserRepo,
    private readonly kycRepo: KycRepo,
    private readonly agreementRepo: AgreementRepo,
    private readonly poolService: PoolService
  ) {}

  async update(userId, poolId?: string, tranche?: Tranche) {
    const user = await this.userRepo.find(userId)
    if (config.globalRestrictedCountries.includes(user.countryCode)) {
      console.error(`User ${userId} is based in ${user.countryCode}, which is restricted globally.`)
      return
    }
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
        const pool = await this.poolService.get(poolId)
        if (!pool || pool?.profile.issuer.restrictedCountryCodes?.includes(user.countryCode)) {
          console.error(`User ${userId} is based in ${user.countryCode}, which is restricted for pool ${poolId}.`)
          return
        }

        const agreements = await this.agreementRepo.getByUserPoolTranche(userId, poolId, t)
        const done = agreements.every((agreement: Agreement) => agreement.signedAt && agreement.counterSignedAt)
        if (done) {
          this.poolService.addToMemberlist(userId, poolId, t)
        }
      })
    })
  }
}
