import { AnchorButton, Box, Dialog, Shelf, TextInput } from '@centrifuge/fabric'
import * as React from 'react'
import { Report } from './ReportContext'
import { Pool } from '@centrifuge/centrifuge-js'
import { usePoolMetadata } from '../../utils/usePools'
import { GraphQLCodeBlock } from 'react-graphql-syntax-highlighter';
import 'react-graphql-syntax-highlighter/dist/style.css';
import styled from 'styled-components'

type Props = {
  open: boolean
  onClose: () => void
  report: Report
  pool: Pool
}

const reportNameMapping = {
  'investor-tx': 'investor transactions',
  'asset-tx': 'asset transactions',
  'pool-balance': 'pool balance',
  'asset-list': 'asset list',
  'holders': 'holders'
}

const code = `query($poolId: String!) {
  investorTransactions(
    orderBy: TIMESTAMP_ASC,
    filter: {
      poolId: { equalTo: $poolId }
    }) {
    nodes {
      id
      timestamp
      accountId
      account {
        chainId
        evmAddress
      }
      poolId
      trancheId
      epochNumber
      type
      tokenAmount
      currencyAmount
      tokenPrice
      transactionFee
    }
  }
}`

const GraphqlCode = styled(Box)`
  background: #efefef;
  padding: 20px;
  max-height: 250px;
  overflow-y: auto;
`

export const QueryDialog: React.FC<Props> = ({ open, onClose, report, pool }) => {
  const { data: poolMetadata } = usePoolMetadata(pool)

  function close() {
    onClose()
  }

  return (
    <Dialog isOpen={open} onClose={close} title={`Query ${reportNameMapping[report]} using API`} subtitle={`Use GraphQL to get access to a live feed of the underlying data of ${poolMetadata?.pool?.name}`}>

      You can run the following query:
      <GraphqlCode>
        <GraphQLCodeBlock src={code} />
      </GraphqlCode>

      On this API endpoint:
      <Shelf>
        <Box flex={1}>
          <TextInput
            value={import.meta.env.REACT_APP_SUBQUERY_URL as string}
          />
        </Box>
        <Box ml="12px">
          <AnchorButton variant="secondary" small>
            Copy
        </AnchorButton>
        </Box>
      </Shelf>
    </Dialog>
  )
}