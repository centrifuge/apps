import * as React from 'react';
import { InternalSingleLoan } from '../../ducks/loans';
import { Text, Box, FormField, TextInput, Heading, Paragraph } from 'grommet';
import styled from 'styled-components';
import { formatAddress } from '../../utils/formatAddress';
import Badge from '../Badge';
import { NFT } from '../../ducks/nft';
import NftDataField, { DisplayedField } from '../NftDataField';
import config from '../../config';

interface Props {
  data: InternalSingleLoan | NFT;
  authedAddr: string;
}

class NftData extends React.Component<Props> {

  renderNFTData() {
    const { data } = this.props;
    const { nftDataDefinition }  = config;
    if (!data.nftData) {
      return <Text> No NFT metadata found on this token!</Text>;
    }
    return nftDataDefinition.displayedFields.map((field: DisplayedField) =>
        <Box basis={'1/4'} gap="medium" key={field.key}>
          <NftDataField displayedField={field} value={data.nftData[field.key]} />
        </Box>
      );
  }

  render() {
    const { nftDataDefinition } = config;
    const { data: { tokenId, nftOwner }, authedAddr } = this.props;

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
              <Badge text={'Me'} style={{ position: 'absolute', left: 100, top: 32 }} />}
          </FormField>
        </Box>
        <Box basis={'1/4'} gap="medium" />
        <Box basis={'1/4'} gap="medium" />
      </Box>

      <Paragraph>The following metadata was read from the NFT:</Paragraph>
      <Box direction="row" gap="medium" margin={{ bottom: 'none', top: 'small' }}>
        { this.renderNFTData() }
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
