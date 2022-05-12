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
import MailerService from '../services/mailer.service'
import { MemberlistService } from '../services/memberlist.service'
import { CustomPoolIds, PoolService } from '../services/pool.service'
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
    private readonly memberlistService: MemberlistService,
    private readonly mailerService: MailerService
  ) {}

  @Get('pools/:poolId/agreements/:provider/:providerTemplateId/redirect')
  async redirectToAgreement(@Param() params, @Query() query, @Res({ passthrough: true }) res) {
    const pool = await this.poolService.get(params.poolId.trim())
    if (!pool) throw new BadRequestException('Invalid pool')

    if (!query.session) throw new BadRequestException('Missing session')
    const verifiedSession = this.sessionService.verify(query.session)
    if (!verifiedSession) {
      const returnUrl = CustomPoolIds.includes(params.poolId.trim())
        ? `${config.tinlakeUiHost}onboarding/${params.poolId.trim()}`
        : `${config.tinlakeUiHost}pool/${params.poolId.trim()}/${pool.metadata.slug}/onboarding`
      console.error(`Invalid session`)
      return res.redirect(returnUrl)
    }

    const user = await this.userRepo.find(verifiedSession.sub)
    if (!user) throw new BadRequestException('User for this agreement does not exist')

    const profileAgreement = pool.profile?.agreements.find(
      (pa) => pa.provider === params.provider && pa.providerTemplateId === params.providerTemplateId
    )
    if (!profileAgreement) throw new BadRequestException('Profile agreement cannot be found')
    const agreement = await this.agreementRepo.findOrCreate(
      user.id,
      user.email,
      user.entityName?.length > 0 ? user.entityName : user.fullName,
      params.poolId.trim(),
      profileAgreement.tranche,
      profileAgreement.name,
      profileAgreement.providerTemplateId
    )

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
      await this.mailerService.sendSubscriptionAgreementEmail(user, pool, agreement.tranche)
    }

    const returnUrl = CustomPoolIds.includes(params.poolId)
      ? `${config.tinlakeUiHost}onboarding/${params.poolId}`
      : `${config.tinlakeUiHost}pool/${params.poolId}/${pool.metadata.slug}/onboarding?tranche=${agreement.tranche}`
    return res.redirect(returnUrl)
  }

  @Post('docusign/connect')
  async postDocusignConnect(@Body() content: DocusignConnectDto): Promise<string> {
    const envelopeId = content.envelopeId
    console.log(`Received Docusign Connect message for envelope ID ${envelopeId}, status is ${content.status}`)

    const agreement = await this.agreementRepo.findByProvider('docusign', envelopeId)
    if (!agreement) {
      console.warn(`Agreement for docusign envelope id ${envelopeId} not found`)
      return 'OK'
    }

    if (content.status === 'declined') {
      this.agreementRepo.setDeclined(agreement.id)
      if (!agreement.declinedAt) {
        const user = await this.userRepo.find(agreement.userId)
        const pool = await this.poolService.get(agreement.poolId)
        this.mailerService.sendAgreementVoidedEmail(user, pool, agreement.tranche, 'declined')
      }
      return 'OK'
    }

    if (content.status === 'voided') {
      this.agreementRepo.setVoided(agreement.id)
      const user = await this.userRepo.find(agreement.userId)
      const pool = await this.poolService.get(agreement.poolId)
      this.mailerService.sendAgreementVoidedEmail(user, pool, agreement.tranche, 'voided')
      return 'OK'
    }

    const investor = content.recipients.signers.find((signer: any) => signer.roleName === InvestorRoleName)
    const issuer = content.recipients.signers.find((signer: any) => signer.roleName === IssuerRoleName)

    const status = {
      signed: investor?.status === 'completed',
      counterSigned: issuer?.status === 'completed',
    }

    if (!agreement.signedAt && status.signed) {
      await this.agreementRepo.setSigned(agreement.id)
      const user = await this.userRepo.find(agreement.userId)
      const pool = await this.poolService.get(agreement.poolId)
      await this.mailerService.sendSubscriptionAgreementEmail(user, pool, agreement.tranche)
    }

    if (!agreement.counterSignedAt && status.counterSigned) {
      await this.agreementRepo.setCounterSigned(agreement.id)
      this.memberlistService.update(agreement.userId, agreement.poolId, agreement.tranche)
    }

    return 'OK'
  }
}

interface SignerDto {
  roleName: string
  status: string
}

interface DocusignConnectDto {
  envelopeId: string
  status: string
  recipients: {
    signers: SignerDto[]
  }
}
