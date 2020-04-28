import { Test, TestingModule } from '@nestjs/testing';
import { SessionGuard } from '../../auth/SessionGuard';
import { databaseServiceProvider } from '../../database/database.providers';
import { NftsController } from '../nfts.controller';
import { centrifugeServiceProvider } from '../../centrifuge-client/centrifuge.module';
import { CentrifugeService } from '../../centrifuge-client/centrifuge.service';

describe('NftsController', () => {
  let nftModule: TestingModule;
  const centApiSpies: any = {};

  beforeEach(async () => {
    nftModule = await Test.createTestingModule({
      controllers: [NftsController],
      providers: [
        SessionGuard,
        centrifugeServiceProvider,
        databaseServiceProvider,
      ],
    }).compile();

    const centrifugeService = nftModule.get<CentrifugeService>(CentrifugeService);
    centApiSpies.spyMintNft = jest.spyOn(centrifugeService.nft, 'mintNft');
    centApiSpies.spyTransfer = jest.spyOn(centrifugeService.nft, 'transferNft');
  });
  // TODO: make tests pass

  // it('Should mint a nft', async () => {
  //   const nftController = nftModule.get<NftsController>(
  //     NftsController,
  //   );
  //
  //   const payload = {
  //     document_id: '0xSomeId',
  //     deposit_address: '0x333',
  //     registry_address: '0x111',
  //     proof_fields: ['some_field'],
  //   };
  //
  //   const result = await nftController.mintNFT(
  //     { user: { _id: 'user_id', account: '0xUserAccount' } },
  //     payload,
  //     )
  //   ;
  //
  //   expect(centApiSpies.spyMintNft).toHaveBeenCalledWith(
  //     '0xUserAccount',
  //     payload.registry_address,
  //     {
  //       document_id: '0xSomeId',
  //       proof_fields: payload.proof_fields,
  //       deposit_address: payload.deposit_address,
  //     });
  // });

  it('Should transfer a nft', async () => {
    const nftController = nftModule.get<NftsController>(
      NftsController,
    );
    const payload = {
      token_id: '0xSomeId',
      to: '0x333',
      registry: '0x111',
    };

    const result = await nftController.transfer(
      { user: { _id: 'user_id', account: '0xUserAccount' } },
      payload,
      )
    ;

    expect(centApiSpies.spyTransfer).toHaveBeenCalledWith(
      '0xUserAccount',
      payload.registry,
      payload.token_id,
      {
        to: payload.to,
      });
  });

});
