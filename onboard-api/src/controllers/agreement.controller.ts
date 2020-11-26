import { Controller, Get, NotFoundException, Param } from '@nestjs/common'
import { AgreementRepo } from '../repos/agreement.repo'
import { DocusignService } from '../services/docusign.service'

@Controller()
export class AgreementController {
  constructor(private readonly agreementRepo: AgreementRepo, private readonly docusignService: DocusignService) {}

  // TODO: this should probably only be returned after verifying address ownership
  @Get('agreements/:id/link')
  async getAgreementLink(@Param() params): Promise<string> {
    const agreement = await this.agreementRepo.find(params.id)
    if (!agreement) throw new NotFoundException(`Agreement ${params.id} not found`)

    return this.docusignService.getAgreementLink(agreement.providerEnvelopeId)
  }
}
