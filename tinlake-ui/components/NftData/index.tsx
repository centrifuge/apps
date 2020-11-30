import { DisplayField } from '@centrifuge/axis-display-field'
import { bnToHex, NFT } from '@centrifuge/tinlake-js'
import { Box, Heading } from 'grommet'
import * as React from 'react'
import styled from 'styled-components'
import { getAddressLink, getNFTLink, hexToInt } from '../../utils/etherscanLinkGenerator'
import Badge from '../Badge'

interface Props {
  data: NFT
  authedAddr: string
}

class NftData extends React.Component<Props> {
  render() {
    const {
      data: { registry, tokenId, nftOwner },
      authedAddr,
    } = this.props

    return (
      <NftDataContainer>
        <Heading level="5" margin="none">
          NFT Data
        </Heading>
        <Box direction="row" gap="medium" margin={{ bottom: 'large', top: 'medium' }}>
          <Box basis={'1/3'} gap="medium">
            <DisplayField
              label={'NFT ID'}
              copy={true}
              as={'span'}
              value={hexToInt(bnToHex(tokenId).toString())}
              link={{
                href: getNFTLink(hexToInt(bnToHex(tokenId).toString()), registry),
                target: '_blank',
              }}
            />
          </Box>
          <Box basis={'1/3'} gap="medium">
            <DisplayField
              label={'NFT registry'}
              copy={true}
              as={'span'}
              value={registry}
              link={{
                href: getAddressLink(registry),
                target: '_blank',
              }}
            />
          </Box>
          <Box basis={'1/3'} gap="medium">
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
            {authedAddr === nftOwner && <Badge text={'Me'} style={{ position: 'absolute', left: 100, top: 32 }} />}
          </Box>
        </Box>
        <Box direction="row" gap="medium" margin={{ bottom: 'small', top: 'medium' }}></Box>
      </NftDataContainer>
    )
  }
}

export default NftData

const NftDataContainer = styled(Box)`
  margin: 56px 0;
  padding: 20px;
  border-radius: 3px;
  background: #f7f7f7;
`
