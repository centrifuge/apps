import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common'
import config from '../config'
import { AgreementRepo } from '../repos/agreement.repo'
import { UserRepo } from '../repos/user.repo'
import { DocusignService, InvestorRoleName, IssuerRoleName } from '../services/docusign.service'
import { MemberlistService } from '../services/memberlist.service'
import { PoolService } from '../services/pool.service'
import { SessionService } from '../services/session.service'

@Controller()
export class AgreementController {
  private readonly logger = new Logger(AgreementController.name)

  constructor(
    private readonly agreementRepo: AgreementRepo,
    private readonly docusignService: DocusignService,
    private readonly userRepo: UserRepo,
    private readonly poolService: PoolService,
    private readonly sessionService: SessionService,
    private readonly memberlistService: MemberlistService
  ) {}

  @Get('pools/:poolId/agreements/:agreementId/redirect')
  async redirectToAgreement(@Param() params, @Query() query, @Res({ passthrough: true }) res) {
    if (!query.session) throw new BadRequestException('Missing session')

    const agreement = await this.agreementRepo.find(params.agreementId)
    if (!agreement) throw new NotFoundException(`Agreement ${params.agreementId} not found`)

    const user = await this.userRepo.find(agreement.userId)
    if (!user) throw new BadRequestException('User for this agreement does not exist')

    const pool = await this.poolService.get(params.poolId)
    if (!pool) throw new BadRequestException('Invalid pool')

    const verifiedSession = this.sessionService.verify(query.session, user.id)
    if (!verifiedSession) {
      const returnUrl = `${config.tinlakeUiHost}pool/${params.poolId}/${pool.metadata.slug}/onboarding?tranche=${agreement.tranche}`
      console.error(`Invalid session for user ${user.id}`)
      return res.redirect(returnUrl)
    }

    const returnUrl = `${config.onboardApiHost}pools/${params.poolId}/agreements/${agreement.id}/callback`
    const link = await this.docusignService.getAgreementLink(agreement.providerEnvelopeId, user, returnUrl)

    return res.redirect(link)
  }

  @Get('pools/:poolId/agreements/:agreementId/callback')
  async agreementCallback(@Param() params, @Res({ passthrough: true }) res) {
    const agreement = await this.agreementRepo.find(params.agreementId)
    if (!agreement) throw new NotFoundException(`Agreement ${params.agreementId} not found`)

    const user = await this.userRepo.find(agreement.userId)
    if (!user) throw new BadRequestException('User for this agreement does not exist')

    const pool = await this.poolService.get(params.poolId)
    if (!pool) throw new BadRequestException('Invalid pool')

    const status = await this.docusignService.getEnvelopeStatus(agreement.providerEnvelopeId)
    if (!agreement.signedAt && status.signed) {
      this.logger.log(`Agreement ${agreement.id} has been signed`)
      await this.agreementRepo.setSigned(agreement.id)
    }

    const returnUrl = `${config.tinlakeUiHost}pool/${params.poolId}/${pool.metadata.slug}/onboarding?tranche=${agreement.tranche}`
    return res.redirect(returnUrl)
  }

  @Post('docusign/connect')
  async postDocusignConnect(@Body() body): Promise<string> {
    const content = JSON.parse(body)
    const envelopeId = content.envelopeId
    console.log(`Received Docusign Connect message for envelope ID ${envelopeId}`)

    const agreement = await this.agreementRepo.findByProvider('docusign', envelopeId)
    if (!agreement) throw new NotFoundException(`Agreement for docusign envelope id ${envelopeId} not found`)

    const investor = content.recipients.signers.find((signer: any) => signer.roleName === InvestorRoleName)
    const issuer = content.recipients.signers.find((signer: any) => signer.roleName === IssuerRoleName)

    const status = {
      signed: investor?.status === 'completed',
      counterSigned: issuer?.status === 'completed',
    }
    console.log({ status })

    if (!agreement.signedAt && status.signed) {
      await this.agreementRepo.setSigned(agreement.id)
    }

    if (!agreement.counterSignedAt && status.counterSigned) {
      await this.agreementRepo.setCounterSigned(agreement.id)
      this.memberlistService.update(agreement.userId, agreement.poolId, agreement.tranche)
    }

    return 'OK'
  }
}
