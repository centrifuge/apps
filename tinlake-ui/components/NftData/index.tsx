import { DisplayField } from '@centrifuge/axis-display-field'
import { bnToHex, NFT } from '@centrifuge/tinlake-js'
import { Box, Heading } from 'grommet'
import * as React from 'react'
import { getAddressLink, getNFTLink, hexToInt } from '../../utils/etherscanLinkGenerator'

interface Props {
  data: NFT
  authedAddr: string
}

class NftData extends React.Component<Props> {
  render() {
    const {
      data: { registry, tokenId, nftOwner },
    } = this.props

    return (
      <>
        <Heading margin={{ top: 'large' }} level="5">
          NFT Data
        </Heading>
        <Box pad="medium" elevation="small" round="xsmall" background="white" width="80%">
          <Box direction="row" gap="medium" margin={{ bottom: 'medium', top: 'medium' }}>
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
                label={'NFT current owner'}
                copy={true}
                as={'span'}
                value={nftOwner}
                link={{
                  href: getAddressLink(nftOwner),
                  target: '_blank',
                }}
              />
            </Box>
          </Box>
        </Box>
      </>
    )
  }
}

export default NftData
