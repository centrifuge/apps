import { AnchorButton, Box, Dialog, Shelf, TextInput, Text } from '@centrifuge/fabric'
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

const reportCodeMapping = {
  'investor-tx': `query($poolId: String!) {
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
  }`,
  'asset-tx': `query($poolId: String!) {
      borrowerTransactions(
        orderBy: TIMESTAMP_ASC,
        filter: {
          poolId: { equalTo: $poolId }
        }) {
        nodes {
          loanId
          epochId
          type
          timestamp
          amount
          settlementPrice
          quantity
        }
      }
    }
  `,
  'pool-balance': `TODO`,
  'asset-list': `TODO`,
  'holders': `query($poolId: String) {
        trancheBalances(
          filter: {
            poolId: { equals: $poolId }
          }) {
        nodes {
          accountId
          account {
            chainId
            evmAddress
          }
          pendingInvestCurrency
          claimableTrancheTokens
          sumClaimedTrancheTokens
          pendingRedeemTrancheTokens
          claimableCurrency
          sumClaimedCurrency
        }
      }

      currencyBalances(
        filter: {
          currency: { poolId: { equals: $poolId } }
        }) {
        nodes {
          accountId
          account {
            chainId
            evmAddress
          }
          currencyId
          amount
        }
      }
    }`
}

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
        <GraphQLCodeBlock src={reportCodeMapping[report]} />
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

      <Text as="p" variant="body3" textAlign="center">
        For more information, you can refer to the {' '}
        <Text
          as="a"
          href="https://docs.centrifuge.io/"
          target="_blank"
          rel="noopener noreferrer"
          textDecoration="underline"
        >
          API documentation
        </Text>
      </Text>
    </Dialog>
  )
}