import { Controller, Get, Param } from '@nestjs/common'

import { AddressRepo, Address } from '../repos/address.repo'

@Controller()
export class AddressController {
  constructor(private readonly addressRepo: AddressRepo) {}

  @Get('addresses/:address')
  async find(@Param() params): Promise<any> {
    const blockchain = 'ethereum' // TODO: implement as query param
    const network = 'mainnet' // TODO: implement as query param
    console.log(`Looking up address ${params.address}`)

    return await this.addressRepo.find(blockchain, network, params.address)
  }
}
