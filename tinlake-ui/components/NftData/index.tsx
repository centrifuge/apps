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
              done={props.data?.tokenId !== undefined && props.data?.registry !== undefined}
            >
              {props.data?.tokenId && props.data?.registry && (
                <DisplayField
                  label={'NFT ID'}
                  copy={true}
                  as={'span'}
                  value={hexToInt(bnToHex(props.data.tokenId).toString())}
                  link={{
                    href: getNFTLink(hexToInt(bnToHex(props.data.tokenId).toString()), props.data.registry),
                    target: '_blank',
                  }}
                />
              )}
            </LoadingValue>
          </Box>
          <Box basis={'1/3'} gap="medium">
            <LoadingValue alignRight={false} height={49} done={props.data?.registry !== undefined}>
              {props.data?.registry && (
                <DisplayField
                  label={'NFT registry'}
                  copy={true}
                  as={'span'}
                  value={props.data.registry}
                  link={{
                    href: getAddressLink(props.data.registry),
                    target: '_blank',
                  }}
                />
              )}
            </LoadingValue>
          </Box>
          <Box basis={'1/3'} gap="medium">
            <LoadingValue alignRight={false} height={49} done={props.data?.nftOwner !== undefined}>
              {props.data?.nftOwner && (
                <DisplayField
                  label={'NFT current owner'}
                  copy={true}
                  as={'span'}
                  value={props.data.nftOwner}
                  link={{
                    href: getAddressLink(props.data.nftOwner),
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
