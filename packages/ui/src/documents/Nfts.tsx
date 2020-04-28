import React, { FunctionComponent } from 'react';
import { useMergeState } from '../hooks';
import { httpClient } from '../http-client';
import { Modal } from '@centrifuge/axis-modal';
import { Document } from '@centrifuge/gateway-lib/models/document';
import { getAddressLink, getNFTLink, hexToInt } from '@centrifuge/gateway-lib/utils/etherscan';
import { Section } from '../components/Section';
import { Anchor, Box, Button, Paragraph } from 'grommet';
import { DisplayField } from '@centrifuge/axis-display-field';
import { Money } from 'grommet-icons';
import { Registry } from '@centrifuge/gateway-lib/models/schema';
import MintNftForm, { MintNftFormData } from './MintNftForm';
import { canTransferNft, User } from '@centrifuge/gateway-lib/models/user';
import { TransferNftRequest } from '@centrifuge/gateway-lib/models/nfts';
import TransferNftForm from './TransferNftForm';
import { Contact } from '@centrifuge/gateway-lib/src/models/contact';
import { CoreapiNFT } from '@centrifuge/gateway-lib/centrifuge-node-client';
import { DataTableWithDynamicHeight } from '../components/DataTableWithDynamicHeight';

type Props = {
  onAsyncStart?: (message: string) => void;
  onAsyncComplete?: (data) => void;
  onAsyncError?: (error, title?: string) => void;
  document: Document,
  user: User,
  contacts: Contact[],
  registries: Registry[],
  viewMode: boolean,
}

type State = {
  mintModalOpened: boolean
  transferModalOpened: boolean
  selectedNft: CoreapiNFT | null
}

export const Nfts: FunctionComponent<Props> = (props) => {

  const [{
    mintModalOpened,
    transferModalOpened,
    selectedNft,
  }, setState] = useMergeState<State>({
    mintModalOpened: false,
    transferModalOpened: false,
    selectedNft: null,
  });


  const {
    onAsyncStart,
    onAsyncComplete,
    onAsyncError,
    document,
    contacts,
    registries,
    user,
    viewMode,
  } = {
    onAsyncStart: (message: string) => {
    },
    onAsyncComplete: (data) => {
    },
    onAsyncError: (error, title?: string) => {
    },
    ...props,
  };


  const mintNFT = async (id: string, data: MintNftFormData) => {

    onAsyncStart('Minting NFT');

    try {
      onAsyncComplete((await httpClient.nfts.mint(
        {
          document_id: id,
          deposit_address: data.transfer ? data.deposit_address : user!.account,
          proof_fields: data.registry!.proofs,
          registry_address: data.registry!.address,
          asset_manager_address: data.registry!.asset_manager_address
        },
      )).data);
    } catch (e) {
      onAsyncError(e, 'Failed to mint NFT');
    }
  };

  const transferNFT = async (data: TransferNftRequest) => {

    onAsyncStart('Transferring NFT');

    try {
      onAsyncComplete((await httpClient.nfts.tranfer(
        data,
      )).data);
    } catch (e) {
      onAsyncError(e, 'Failed to transfer NFT');
    }
  };

  const openMintModal = () => {
    setState({ mintModalOpened: true });
  };

  const openTransferModal = (selectedNft: CoreapiNFT) => {
    setState({
      selectedNft,
      transferModalOpened: true,
    });
  };

  const closeModal = () => {
    setState({
      mintModalOpened: false,
      transferModalOpened: false,
    });
  };

  const mintActions = !viewMode ? [
    <Button key="mint-nft" onClick={openMintModal} icon={<Money/>} plain label={'Mint NFT'}/>,
  ] : [];

  const renderNftSection = () => {
    return (<Section
      title="NFTs"
      actions={mintActions}
    >

      <DataTableWithDynamicHeight
        size={'360px'}
        sortable={false}
        data={document!.header!.nfts || []}
        primaryKey={'token_id'}
        columns={[
          {
            property: 'token_id',
            header: 'Token ID',
            render: datum => <DisplayField
              copy={true}
              as={'span'}
              link={{
                href: getNFTLink(datum.token_id, datum.registry),
                target: '_blank',
              }}
              value={hexToInt(datum.token_id)}/>,
          },

          {
            property: 'registry',
            header: 'Registry',
            render: datum => <DisplayField
              copy={true}
              as={'span'}
              link={{
                href: getAddressLink(datum.registry),
                target: '_blank',
              }}
              value={datum.registry}/>,
          },
          {
            property: 'owner',
            header: 'Owner',
            render: datum => <DisplayField
              copy={true}
              as={'span'}
              link={{
                href: getAddressLink(datum.owner),
                target: '_blank',
              }}
              value={datum.owner}/>,

          },
          {
            property: '_id',
            header: 'Actions',
            sortable: false,
            render: datum => {
              return canTransferNft(user, datum) ? <Box direction="row" gap="small">
                <Anchor
                  label={'Transfer'}
                  onClick={() => openTransferModal(datum)}
                />
              </Box> : [];
            },
          },
        ]}
      />

      {!document!.header!.nfts &&
      <Paragraph color={'dark-2'}>There are no NFTs minted on this document yet.</Paragraph>}
    </Section>);
  };

  return <>
    <Modal
      width={'large'}
      opened={mintModalOpened}
      headingProps={{ level: 3 }}
      title={`Mint NFT`}
      onClose={closeModal}
    >
      <MintNftForm
        // @ts-ignore
          onSubmit={(data) => mintNFT(document.header!.document_id!, data)}
        onDiscard={closeModal}
        registries={registries}
      />
    </Modal>

    <Modal
      width={'large'}
      opened={transferModalOpened}
      headingProps={{ level: 3 }}
      title={`Transfer NFT`}
      onClose={closeModal}
    >
      <TransferNftForm
        nft={selectedNft!}
        onSubmit={(data) => transferNFT(data)}
        onDiscard={closeModal}
        contacts={contacts}
      />
    </Modal>

    {renderNftSection()}

  </>;
};

