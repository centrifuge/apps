import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common'
import { AddressRepo } from '../repos/address.repo'
import { Agreement, AgreementRepo } from '../repos/agreement.repo'
import { KycRepo } from '../repos/kyc.repo'
import { DocusignService } from '../services/docusign.service'
import { SecuritizeService } from '../services/kyc/securitize.service'

@Controller()
export class AddressController {
  constructor(
    private readonly addressRepo: AddressRepo,
    private readonly securitizeService: SecuritizeService,
    private readonly kycRepo: KycRepo,
    private readonly agreementRepo: AgreementRepo,
    private readonly docusignService: DocusignService
  ) {}

  @Get('pools/:poolId/addresses/:address')
  async getStatus(@Param() params, @Query() query): Promise<AddressStatus> {
    const blockchain = query.blockchain || 'ethereum'
    const network = query.network || 'mainnet'

    const address = await this.addressRepo.findOrCreate(blockchain, network, params.address)
    if (!address) throw new BadRequestException('Failed to create address')

    const authorizationLink = this.securitizeService.getAuthorizationLink(params.poolId, params.address)
    const kyc = await this.kycRepo.find(address.userId)
    if (kyc) {
      // TODO: if not verified, check verified status
      const agreements = await this.agreementRepo.findByUser(address.userId)

      // TODO: this should be handled in a Connect webhook from Docusign
      agreements.forEach(async (agreement: Agreement) => {
        if (!agreement.signedAt || !agreement.counterSignedAt) {
          const status = await this.docusignService.getEnvelopeStatus(agreement.providerEnvelopeId)
          console.log(status)
          if (!agreement.signedAt && status.signed) {
            await this.agreementRepo.setSigned(agreement.id)
          }

          if (!agreement.counterSignedAt && status.counterSigned) {
            await this.agreementRepo.setCounterSigned(agreement.id)
          }
        }
      })

      // TODO: this is a hack, we shouldn't need to retrieve them twice
      const agreementLinks = await (await this.agreementRepo.findByUser(address.userId)).map(
        (agreement: Agreement): AgreementsStatus => {
          return {
            name: 'Subscription Agreement',
            id: agreement.id,
            signed: agreement.signedAt !== null,
            counterSigned: agreement.counterSignedAt !== null,
          }
        }
      )

      return {
        kyc: {
          url: authorizationLink,
          created: kyc.createdAt !== null,
          verified: kyc.verifiedAt !== null,
        },
        agreements: agreementLinks,
      }
    }

    return {
      kyc: {
        url: authorizationLink,
      },
      agreements: [],
    }
  }
}

export interface KycStatus {
  created?: boolean
  verified?: boolean
  url?: string
}

// TODO: remove whether it's been created
export interface AgreementsStatus {
  name: string
  id: string
  signed?: boolean
  counterSigned?: boolean
}

export interface AddressStatus {
  kyc: KycStatus
  agreements: AgreementsStatus[]
}
