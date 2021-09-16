import { DisplayField } from '@centrifuge/axis-display-field'
import { bnToHex, NFT } from '@centrifuge/tinlake-js'
import * as React from 'react'
import { getAddressLink, getNFTLink, hexToInt } from '../../utils/etherscanLinkGenerator'
import { Card } from '../Card'
import { SectionHeading } from '../Heading'
import { Box, Grid, Stack } from '../Layout'
import { LoadingValue } from '../LoadingValue'

interface Props {
  data: NFT | undefined
}

const NftData: React.FC<Props> = (props: Props) => {
  return (
    <Stack gap="medium">
      <SectionHeading>NFT Data</SectionHeading>
      <Card p="medium" maxWidth={{ medium: 900 }}>
        <Grid columns={[1, 3]} gap="medium" justifyItems="start" equalColumns>
          <Box minWidth={0} maxWidth="100%">
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
          <Box minWidth={0} maxWidth="100%">
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
          <Box minWidth={0} maxWidth="100%">
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
        </Grid>
      </Card>
    </Stack>
  )
}

export default NftData
