import * as React from 'react'
import { Box, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { DisplayField } from '@centrifuge/axis-display-field'
import { getNFTLink, getAddressLink, hexToInt } from '../../utils/etherscanLinkGenerator'
import { bnToHex, NFT } from '@centrifuge/tinlake-js'
import styled from 'styled-components'

const DisplayFieldWrapper = styled.div`
  width: 100%;
  max-width: 200px;

  > div {
    padding: 0;
  }
`

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
      <Box margin={{ top: 'medium' }}>
        <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
          <Heading level="5" margin={'0'}>
            NFT Data
          </Heading>
        </Box>

        <Table margin={{ bottom: 'small' }}>
          <TableBody>
            <TableRow>
              <TableCell scope="row">NFT ID</TableCell>
              <TableCell style={{ textAlign: 'end', float: 'right' }}>
                <DisplayFieldWrapper>
                  <DisplayField
                    copy={true}
                    as={'span'}
                    value={hexToInt(bnToHex(tokenId).toString())}
                    link={{
                      href: getNFTLink(hexToInt(bnToHex(tokenId).toString()), registry),
                      target: '_blank',
                    }}
                    style={{ padding: '0' }}
                  />
                </DisplayFieldWrapper>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row">NFT registry</TableCell>
              <TableCell style={{ textAlign: 'end', float: 'right' }}>
                <DisplayFieldWrapper>
                  <DisplayField
                    copy={true}
                    as={'span'}
                    value={registry}
                    link={{
                      href: getAddressLink(registry),
                      target: '_blank',
                    }}
                  />
                </DisplayFieldWrapper>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row">NFT owner</TableCell>
              <TableCell style={{ textAlign: 'end', float: 'right' }}>
                <DisplayFieldWrapper>
                  <DisplayField
                    copy={true}
                    as={'span'}
                    value={nftOwner}
                    link={{
                      href: getAddressLink(nftOwner),
                      target: '_blank',
                    }}
                  />
                </DisplayFieldWrapper>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>
    )
  }
}

export default NftData
