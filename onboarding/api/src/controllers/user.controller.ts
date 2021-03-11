import { Controller, Get, NotFoundException, Param } from '@nestjs/common'
import { AddressEntity, AddressRepo } from '../repos/address.repo'
import { PoolService } from '../services/pool.service'
import { Agreement, AgreementRepo } from '../repos/agreement.repo'
import { UserRepo, UserWithKyc } from '../repos/user.repo'

@Controller()
export class UserController {
  constructor(
    private readonly agreementRepo: AgreementRepo,
    private readonly userRepo: UserRepo,
    private readonly poolService: PoolService,
    private readonly addressRepo: AddressRepo
  ) {}

  // TODO: add authentication to this endpoint
  @Get('users/:poolId')
  async getUsers(@Param() params) {
    // return {}

    const pool = this.poolService.get(params.poolId)
    if (!pool) throw new NotFoundException(`Pool ${params.poolId} not found`)

    const usersWithKyc: UserWithKyc[] = await this.userRepo.getWithKycAndAgreement(params.poolId)

    const agreements = await this.agreementRepo.getByUserIds(
      usersWithKyc.map((user) => user.id),
      params.poolId
    )
    const agreementsByUserId: AgreementList = agreements.reduce((prev: AgreementList, a: Agreement) => {
      if (prev[a.userId]) return { ...prev, [a.userId]: [...prev[a.userId], a] }
      else return { ...prev, [a.userId]: [a] }
    }, {})

    const addresses = await this.addressRepo.getByUserIds(usersWithKyc.map((user) => user.id))
    const addressesByUserId: AddressList = addresses.reduce((prev: AddressList, a: AddressEntity) => {
      if (prev[a.userId]) return { ...prev, [a.userId]: [...prev[a.userId], a] }
      else return { ...prev, [a.userId]: [a] }
    }, {})

    let groups = {
      Interested: [],
      'Submitted KYC': [],
      'Awaiting signature': [],
      'Awaiting counter-signature': [],
      'Signed, awaiting KYC': [],
      'Ready to invest': [],
      // Invested: [],
    }
    usersWithKyc.forEach((user: UserWithKyc) => {
      if (user.entityName === '' && user.fullName === '- -') return

      const agreements = user.id in agreementsByUserId ? agreementsByUserId[user.id] : []
      const addresses = user.id in addressesByUserId ? addressesByUserId[user.id] : []
      const userWithRelations = { user, agreements, addresses }

      if (user.status === 'verified' && (agreements.length === 0 || !agreements[0].signedAt)) {
        groups['Awaiting signature'].push(userWithRelations)
      } else if (agreements.length === 0 && user.status !== 'none') groups['Submitted KYC'].push(userWithRelations)
      else if (agreements.length === 0) groups['Interested'].push(userWithRelations)
      else if (agreements[0].counterSignedAt && user.status !== 'verified')
        groups['Signed, awaiting KYC'].push(userWithRelations)
      else if (agreements[0].counterSignedAt) groups['Ready to invest'].push(userWithRelations)
      else if (agreements[0].signedAt) groups['Awaiting counter-signature'].push(userWithRelations)
      else if (user.status !== 'none') groups['Submitted KYC'].push(userWithRelations)
      else groups['interested'].push(userWithRelations)
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
type AddressList = { [key: string]: AddressEntity[] }
export type AgreementMap = { [key: string]: UserWithRelations[] }

export type UserWithRelations = {
  user: UserWithKyc
  agreements: Agreement[]
  addresses: AddressEntity[]
}
