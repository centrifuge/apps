import React, { FunctionComponent } from 'react';
import { useMergeState } from '../hooks';
import { httpClient } from '../http-client';
import { Modal } from '@centrifuge/axis-modal';
import { Document, NftStatus } from '@centrifuge/gateway-lib/models/document';
import {
  getAddressLink,
  getNFTLink,
  hexToInt,
} from '@centrifuge/gateway-lib/utils/etherscan';
import { Section } from '../components/Section';
import { Anchor, Box, Button, Paragraph } from 'grommet';
import { DisplayField } from '@centrifuge/axis-display-field';
import { Registry } from '@centrifuge/gateway-lib/models/schema';
import MintNftForm, { MintNftFormData } from './MintNftForm';
import { Contact } from '@centrifuge/gateway-lib/src/models/contact';
import { CoreapiNFT } from '@centrifuge/gateway-lib/centrifuge-node-client';
import { DataTableWithDynamicHeight } from '../components/DataTableWithDynamicHeight';

type Props = {
  onAsyncStart?: (message: string) => void;
  onAsyncComplete?: (data) => void;
  onAsyncError?: (error, title?: string) => void;
  onMintStart?: () => void;
  document: Document;
  contacts: Contact[];
  registries: Registry[];
  viewMode: boolean;
};

type State = {
  mintModalOpened: boolean;
  transferModalOpened: boolean;
  selectedNft: CoreapiNFT | null;
};

export const Nfts: FunctionComponent<Props> = props => {
  const [{ mintModalOpened }, setState] = useMergeState<State>({
    mintModalOpened: false,
    transferModalOpened: false,
    selectedNft: null,
  });

  const {
    onAsyncComplete,
    onAsyncError,
    onMintStart,
    document,
    registries,
    viewMode,
  } = {
    onAsyncComplete: data => {},
    onAsyncError: (error, title?: string) => {},
    onMintStart: () => {},
    ...props,
  };

  const mintNFT = async (id: string, data: MintNftFormData) => {
    closeModal();

    try {
      onMintStart();
      onAsyncComplete(
        (
          await httpClient.nfts.mint({
            document_id: id,
            deposit_address: data.deposit_address,
            proof_fields: data.registry!.proofs,
            registry_address: data.registry!.address,
            asset_manager_address: data.registry!.asset_manager_address,
            oracle_address: data.registry!.oracle_address,
          })
        ).data,
      );
    } catch (e) {
      onAsyncError(e, 'Failed to mint NFT');
    }
  };

  const openMintModal = () => {
    setState({ mintModalOpened: true });
  };

  const closeModal = () => {
    setState({
      mintModalOpened: false,
      transferModalOpened: false,
    });
  };

  const assembleDeepLink = (
    tokenId: string,
    registry: string,
    tinlakePool: string,
  ) => {
    const address = `${tinlakePool}/assets/issue?tokenId=${tokenId}&registry=${registry}`;

    return <Anchor label={'Open Loan'} target={'_blank'} href={address} />;
  };

  const renderNftActions = (datum: any, registries: Registry[]) => {
    let actions;
    if (registries[0].tinlakePool) {
      actions = (
        <Box direction="row" gap="small">
          {assembleDeepLink(
            hexToInt(datum.token_id),
            datum.registry,
            registries[0].tinlakePool,
          )}
        </Box>
      );
    } else {
      actions = [];
    }
    return actions;
  };

  const renderNodeUrl = () => {
    return window['__ETH_NETWORK__'] === 'kovan'
      ? getAddressLink('0x44a0579754D6c94e7bB2c26bFA7394311Cc50Ccb')
      : getAddressLink('0x3ba4280217e78a0eaea612c1502fc2e92a7fe5d7');
  };

  const mintActions = !viewMode
    ? [
        <Button
          key="mint-nft"
          onClick={openMintModal}
          primary={true}
          label={'Mint NFT'}
        />,
      ]
    : [];

  const renderNftSection = () => {
    return (
      <Section title="NFTs" actions={mintActions}>
        <DataTableWithDynamicHeight
          size={'360px'}
          sortable={false}
          data={document!.header!.nfts || []}
          primaryKey={'token_id'}
          columns={[
            {
              property: 'token_id',
              header: 'Token ID',
              render: datum => (
                <DisplayField
                  copy={true}
                  as={'span'}
                  link={{
                    href: getNFTLink(datum.token_id, datum.registry),
                    target: '_blank',
                  }}
                  value={hexToInt(datum.token_id)}
                />
              ),
            },
            {
              property: 'registry',
              header: 'Registry',
              render: datum => (
                <DisplayField
                  copy={true}
                  as={'span'}
                  link={{
                    href: getAddressLink(datum.registry),
                    target: '_blank',
                  }}
                  value={datum.registry}
                />
              ),
            },
            {
              property: 'owner',
              header: 'Owner',
              render: datum => (
                <DisplayField
                  copy={true}
                  as={'span'}
                  link={{
                    href: getAddressLink(datum.owner),
                    target: '_blank',
                  }}
                  value={datum.owner}
                />
              ),
            },
            {
              property: '_id',
              header: 'Actions',
              sortable: false,
              render: datum => {
                return renderNftActions(datum, registries);
              },
            },
          ]}
        />

        {!document!.header!.nfts &&
          (document.nft_status === NftStatus.Minting ? (
            <Paragraph color={'dark-2'}>
              There are no NFTs minted on this document yet. Pending
              transactions can be found {<a href={renderNodeUrl()}>here.</a>}
            </Paragraph>
          ) : (
            <Paragraph color={'dark-2'}>
              There are no NFTs minted on this document yet.
            </Paragraph>
          ))}
      </Section>
    );
  };

  return (
    <>
      <Modal
        width={'large'}
        opened={mintModalOpened}
        headingProps={{ level: 3 }}
        title={`Mint NFT`}
        onClose={closeModal}
      >
        <MintNftForm
          //        @ts-ignore
          onSubmit={data => mintNFT(document.header!.document_id!, data)}
          onDiscard={closeModal}
          registries={registries}
        />
      </Modal>

      {renderNftSection()}
    </>
  );
};
