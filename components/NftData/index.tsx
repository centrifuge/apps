import * as React from 'react';
import { InternalSingleLoan } from '../../ducks/loans';
import { Box, FormField, TextInput, Heading, Paragraph } from 'grommet';
import styled from 'styled-components';
import { formatAddress } from '../../utils/formatAddress';
import MeBadge from '../MeBadge';
import { NFT } from '../../ducks/nft';
import NftDataField, { DisplayedField } from '../NftDataField';
import { config }from '../../config'

interface Props {
  data: InternalSingleLoan | NFT;
  authedAddr: string;
}

interface NftData {
  document_version: string;
  amount: string;
  asis_value: string;
  rehab_value: string;
  borrower: string;
}

const { nftDataDefinition }  = config;
class NftData extends React.Component<Props> {
  render() {
    const { data: { tokenId, nftOwner, nftData }, authedAddr } = this.props;

    // create empty boxes for layout purposes if nft data has != 4 entries
    const nftDataFillers = [
      ...Array(nftDataFillersNeeded(nftDataDefinition.displayedFields.length)).keys()];

    return <NftDataContainer>
      <Heading level="6" margin="none">NFT Data</Heading>
      <Box direction="row" gap="medium" margin={{ bottom: 'large', top: 'medium' }}>
        <Box basis={'1/4'} gap="medium"><FormField label="NFT ID">
          <TextInput value={formatAddress(tokenId.toString())} disabled
            title={tokenId.toString()}/></FormField></Box>
        <Box basis={'1/4'} gap="medium">
          <FormField label="NFT Owner" style={{ position: 'relative' }}>
            <TextInput value={formatAddress(nftOwner)} disabled title={nftOwner} />
            {authedAddr === nftOwner &&
              <MeBadge style={{ position: 'absolute', left: 100, top: 32 }} />}
          </FormField>
        </Box>
        <Box basis={'1/4'} gap="medium" />
        <Box basis={'1/4'} gap="medium" />
      </Box>

      <Paragraph>The following metadata was read from the NFT:</Paragraph>
      <Box direction="row" gap="medium" margin={{ bottom: 'none', top: 'small' }}>
        {nftDataDefinition.displayedFields.map((field: DisplayedField) =>
          <Box basis={'1/4'} gap="medium" key={field.key}>
            <NftDataField displayedField={field} value={nftData[field.key]} />
          </Box>,
        )}
        {nftDataFillers.map(i => <Box key={i} basis={'1/4'} gap="medium" />)}
      </Box>
    </NftDataContainer>;
  }
}

export default NftData;

const NftDataContainer = styled(Box)`
  margin: 56px 0;
  padding: 20px;
  border-radius: 3px;
  background: #f7f7f7;
`;

const nftDataFillersNeeded = (noOfFields: number) => {
  const remainder = noOfFields % 4;
  if (remainder === 0) { return 0; }
  return 4 - remainder;
};
