import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  Request,
  UnauthorizedException,
} from '@nestjs/common'
import config from '../config'
import { AgreementRepo } from '../repos/agreement.repo'
import { UserRepo } from '../repos/user.repo'
import { DocusignService, InvestorRoleName, IssuerRoleName } from '../services/docusign.service'
import { PoolService } from '../services/pool.service'
import { SessionService } from '../services/session.service'

@Controller()
export class AgreementController {
  constructor(
    private readonly agreementRepo: AgreementRepo,
    private readonly docusignService: DocusignService,
    private readonly userRepo: UserRepo,
    private readonly poolService: PoolService,
    private readonly sessionService: SessionService
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

    const returnUrl = `${config.tinlakeUiHost}pool/${params.poolId}/${pool.metadata.slug}/onboarding?tranche=${agreement.tranche}&session=${query.session}`
    const link = await this.docusignService.getAgreementLink(agreement.providerEnvelopeId, user, returnUrl)

    return res.redirect(link)
  }

  // TODO: actually implement this
  @Post('docusign/connect')
  async postDocusignConnect(@Body() body): Promise<string> {
    console.log('Received Docusign Connect message')
    console.log(body)

    const content = JSON.parse(body)
    const investor = content.recipients.signers.find((signer: any) => signer.roleName === InvestorRoleName)
    const issuer = content.recipients.signers.find((signer: any) => signer.roleName === IssuerRoleName)

    const status = {
      signed: investor?.status === 'completed',
      counterSigned: issuer?.status === 'completed',
    }
    console.log({ status })

    return 'OK'
  }
}
