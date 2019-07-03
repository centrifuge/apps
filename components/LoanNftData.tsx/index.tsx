import * as React from 'react';
import { InternalLoan } from '../../ducks/loans';
import { Box, FormField, TextInput, Heading } from 'grommet';
import styled from 'styled-components';
import { formatAddress } from '../../utils/formatAddress';

interface Props {
  loan: InternalLoan;
}

class LoanNftData extends React.Component<Props> {
  render() {
    const { loan: { tokenId, nftOwner } } = this.props;

    return <NftDataContainer>
      <Heading level="6" margin="none">NFT Data</Heading>
      <Box direction="row" gap="medium" margin={{ bottom: 'large', top: 'medium' }}>
        <Box basis={'1/4'} gap="medium"><FormField label="NFT ID">
          <TextInput value={formatAddress(tokenId.toString())} disabled
            title={tokenId.toString()}/></FormField></Box>
        <Box basis={'1/4'} gap="medium"><FormField label="NFT Owner">
          <TextInput value={formatAddress(nftOwner)} disabled title={nftOwner} /></FormField></Box>
      </Box>

      <p>The following metadata was read from the NFT:</p>
      <Box direction="row" gap="medium" margin={{ bottom: 'none', top: 'small' }}>
        <Box basis={'1/4'} gap="medium"><FormField label="Mortgage ID">
          <TextInput value={'TBD'} disabled /></FormField></Box>
        <Box basis={'1/4'} gap="medium"><FormField label="Mortgage Amount">
          <TextInput value={'TBD'} disabled /></FormField></Box>
        <Box basis={'1/4'} gap="medium"><FormField label="Currency">
          <TextInput value={'TBD'} disabled /></FormField></Box>
        <Box basis={'1/4'} gap="medium"><FormField label="Maturity Date">
          <TextInput value={'TBD'} disabled /></FormField></Box>
      </Box>
    </NftDataContainer>;
  }
}

export default LoanNftData;

// tslint:disable-next-line:variable-name
const NftDataContainer = styled(Box)`
  margin: 56px -20px -20px -20px;
  padding: 20px;
  border-radius: 3px;
  background: #f7f7f7;
`;
