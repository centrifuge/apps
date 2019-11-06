import * as React from 'react';
import { InternalSingleLoan } from '../../ducks/loans';
import { Text, Box, Heading, Paragraph } from 'grommet';
import styled from 'styled-components';
import Badge from '../Badge';
import { NFT } from '../../ducks/nft';
import NftDataField, { DisplayedField } from '../NftDataField';
import config from '../../config';
import { DisplayField } from '@centrifuge/axis-display-field';
import { getNFTLink, getAddressLink } from '../../utils/etherscanLinkGenerator'
import { bnToHex } from 'tinlake';

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
    const { nftDataDefinition, contractAddresses } = config;
    const { data: { tokenId, nftOwner }, authedAddr } = this.props;

    // create empty boxes for layout purposes if nft data has != 4 entries
    const nftDataFillers = [
      ...Array(nftDataFillersNeeded(nftDataDefinition.displayedFields.length)).keys()];

    return <NftDataContainer>
      <Heading level="6" margin="none">NFT Data</Heading>
      <Box direction="row" gap="medium" margin={{ bottom: 'large', top: 'medium' }}>
        <Box basis={'1/4'} gap="medium">
         <DisplayField   
            label={'NFT ID'}
            copy={true}
            as={'span'}
            value={bnToHex(tokenId).toString()}
            link={{
                href: getNFTLink(tokenId.toString(), contractAddresses["NFT_COLLATERAL"]),
                target: '_blank',
            }}
          />
        </Box>
        <Box basis={'1/4'} gap="medium">
          <DisplayField  
            label={'NFT Owner'} 
            copy={true}
            as={'span'}
            value={nftOwner}
            link={{
                href: getAddressLink(nftOwner),
                target: '_blank',
            }}
            />
            {authedAddr === nftOwner &&
            <Badge text={'Me'} style={{ position: 'absolute', left: 100, top: 32 }} />}
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
