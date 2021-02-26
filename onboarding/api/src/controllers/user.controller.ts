import { Controller, Get, Param } from '@nestjs/common'
import { PoolService } from 'src/services/pool.service'
import { Agreement, AgreementRepo } from '../repos/agreement.repo'
import { UserRepo, UserWithKyc } from '../repos/user.repo'

@Controller()
export class UserController {
  constructor(
    private readonly agreementRepo: AgreementRepo,
    private readonly userRepo: UserRepo,
    private readonly poolService: PoolService
  ) {}

  // TODO: add authentication to this endpoint
  @Get('users/:poolId')
  async getUsers(@Param() params) {
    // return {}

    const usersWithKyc: UserWithKyc[] = await this.userRepo.getWithKycAndAgreement(params.poolId)

    // TODO: filter by pool
    const agreements = await this.agreementRepo.getByUserIds(usersWithKyc.map((user) => user.id))
    const agreementsByUserId: AgreementList = agreements.reduce((prev: AgreementList, a: Agreement) => {
      if (prev[a.userId]) return { ...prev, [a.userId]: [...prev[a.userId], a] }
      else return { ...prev, [a.userId]: [a] }
    }, {})

    let groups = {
      Interested: [],
      'Submitted KYC': [],
      'Awaiting counter-signature': [],
      'Awaiting KYC': [],
      'Ready to invest': [],
      // Invested: [],
    }
    usersWithKyc.forEach((user: UserWithKyc) => {
      if (user.entityName === '' && user.fullName === '- -') return

      const agreements = user.id in agreementsByUserId ? agreementsByUserId[user.id] : []
      if (agreements.length === 0 && user.status !== 'none') groups['Submitted KYC'].push({ user, agreements })
      else if (agreements.length === 0) groups['Interested'].push({ user, agreements })
      else if (agreements[0].counterSignedAt) groups['Ready to invest'].push({ user, agreements })
      else if (agreements[0].signedAt) groups['Awaiting counter-signature'].push({ user, agreements })
      else if (agreements[0].counterSignedAt && user.status !== 'verified')
        groups['Awaiting KYC'].push({ user, agreements })
      else if (user.status !== 'none') groups['Submitted KYC'].push({ user, agreements })
      else groups['interested'].push({ user, agreements })
    })

    return groups
  }

  // TODO: move to a more sensible controller
  @Get('pools')
  async getPools() {
    return this.poolService.getAll()
  }
}

type AgreementList = { [key: string]: Agreement[] }
export type AgreementMap = { [key: string]: { agreements: Agreement[]; user: UserWithKyc }[] }
