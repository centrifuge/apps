import { DisplayField } from '@centrifuge/axis-display-field'
import { bnToHex, NFT } from '@centrifuge/tinlake-js'
import { Box, Heading } from 'grommet'
import * as React from 'react'
import { getAddressLink, getNFTLink, hexToInt } from '../../utils/etherscanLinkGenerator'
import { LoadingValue } from '../LoadingValue'

interface Props {
  data: NFT | undefined
}

const NftData: React.FC<Props> = (props: Props) => {
  return (
    <>
      <Heading margin={{ top: 'large' }} level="5">
        NFT Data
      </Heading>
      <Box pad="medium" elevation="small" round="xsmall" background="white" width="80%">
        <Box direction="row" gap="medium" margin={{ bottom: 'medium', top: 'medium' }}>
          <Box basis={'1/3'} gap="medium">
            <LoadingValue
              alignRight={false}
              height={49}
              value={props.data && { tokenId: props.data?.tokenId, registry: props.data?.registry }}
            >
              {({ tokenId, registry }) => (
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
              )}
            </LoadingValue>
          </Box>
          <Box basis={'1/3'} gap="medium">
            <LoadingValue alignRight={false} height={49} value={props.data?.registry}>
              {(registry) => (
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
              )}
            </LoadingValue>
          </Box>
          <Box basis={'1/3'} gap="medium">
            <LoadingValue alignRight={false} height={49} value={props.data?.nftOwner}>
              {(nftOwner) => (
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
              )}
            </LoadingValue>
          </Box>
        </Box>
      </Box>
    </>
  )
}

export default NftData
