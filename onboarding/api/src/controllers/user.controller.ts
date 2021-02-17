import { Controller, Get, Param } from '@nestjs/common'
import { Agreement, AgreementRepo } from '../repos/agreement.repo'
import { UserRepo, UserWithKyc } from '../repos/user.repo'

@Controller()
export class UserController {
  constructor(private readonly agreementRepo: AgreementRepo, private readonly userRepo: UserRepo) {}

  // TODO: add authentication to this endpoint
  @Get('users/:poolId')
  async getUsers(@Param() params) {
    return {}

    const usersWithKyc: UserWithKyc[] = await this.userRepo.getWithKycAndAgreement(params.poolId)
    const agreements = await this.agreementRepo.getByUserIds(usersWithKyc.map((user) => user.id))
    const agreementsByUserId: AgreementList = agreements.reduce((prev: AgreementList, a: Agreement) => {
      if (prev[a.userId]) return { ...prev, [a.userId]: [...prev[a.userId], a] }
      else return { ...prev, [a.userId]: [a] }
    }, {})

    // TODO: these states need to be fixed
    let groups = { Interested: [], 'Soft-circled': [], 'Awaiting counter-signature': [], Whitelisted: [] }
    usersWithKyc.forEach((user: UserWithKyc) => {
      const agreements = user.id in agreementsByUserId ? agreementsByUserId[user.id] : []
      if (agreements.length === 0 && user.status !== 'none') groups['Soft-circled'].push({ user, agreements })
      else if (agreements.length === 0) groups['Interested'].push({ user, agreements })
      else if (agreements[0].counterSignedAt) groups['Whitelisted'].push({ user, agreements })
      else if (agreements[0].signedAt) groups['Awaiting counter-signature'].push({ user, agreements })
      else if (user.status !== 'none') groups['Soft-circled'].push({ user, agreements })
      else groups['interested'].push({ user, agreements })
    })

    return groups
  }
}

type AgreementList = { [key: string]: Agreement[] }
export type AgreementMap = { [key: string]: { agreements: Agreement[]; user: UserWithKyc }[] }
