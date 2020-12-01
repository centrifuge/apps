import { BadRequestException, Controller, Get, NotFoundException, Param } from '@nestjs/common'
import { AgreementRepo } from '../repos/agreement.repo'
import { UserRepo } from '../repos/user.repo'
import { DocusignService } from '../services/docusign.service'

@Controller()
export class AgreementController {
  constructor(
    private readonly agreementRepo: AgreementRepo,
    private readonly docusignService: DocusignService,
    private readonly userRepo: UserRepo
  ) {}

  // TODO: this should probably only be returned after verifying address ownership
  @Get('agreements/:id/link')
  async getAgreementLink(@Param() params): Promise<string> {
    const agreement = await this.agreementRepo.find(params.id)
    if (!agreement) throw new NotFoundException(`Agreement ${params.id} not found`)

    const user = await this.userRepo.find(agreement.userId)
    if (!user) throw new BadRequestException('User for this agreement does not exist')

    return this.docusignService.getAgreementLink(agreement.providerEnvelopeId, user)
  }
}
