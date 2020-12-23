import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common'
import { AgreementRepo } from '../repos/agreement.repo'
import { UserRepo } from '../repos/user.repo'
import { DocusignService } from '../services/docusign.service'
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

    // TODO: actually implement this verification
    const verifiedSession = this.sessionService.verify(query.session, user.id)
    if (!verifiedSession) throw new UnauthorizedException('Invalid session')

    const pool = await this.poolService.get(params.poolId)
    if (!pool) throw new BadRequestException('Invalid pool')

    const returnUrl = `${process.env.TINLAKE_UI_HOST}pool/${params.poolId}/${pool.metadata.slug}/investments?onb=1&tranche=${agreement.tranche}&session=${query.session}`
    const link = await this.docusignService.getAgreementLink(agreement.providerEnvelopeId, user, returnUrl)

    return res.redirect(link)
  }

  @Post('docusign/connect')
  async postDocusignConnect(@Body() body): Promise<string> {
    console.log('Received Docusign Connect message')
    console.log(body)
    return 'OK'
  }
}
