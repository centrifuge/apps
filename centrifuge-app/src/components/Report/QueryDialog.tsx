import { AnchorButton, Box, Dialog, Shelf, TextInput, Text, Tabs, TabsItem } from '@centrifuge/fabric'
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

const reportCodeMapping = (poolId: string) => {
  return {
    'investor-tx': `query {
      investorTransactions(
        orderBy: TIMESTAMP_ASC,
        filter: {
          poolId: { equalTo: "${poolId}" }
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
    'asset-tx': `query {
        borrowerTransactions(
          orderBy: TIMESTAMP_ASC,
          filter: {
            poolId: { equalTo: "${poolId}" }
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
    'holders': `query {
          trancheBalances(
            filter: {
              poolId: { equals: "${poolId}" }
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
            currency: { poolId: { equals: "${poolId}" } }
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
}

const GraphqlCode = styled(Box)`
  background: #efefef;
  padding: 20px;
  max-height: 250px;
  overflow-y: auto;
`

export const QueryDialog: React.FC<Props> = ({ open, onClose, report, pool }) => {
  const { data: poolMetadata } = usePoolMetadata(pool)
  const [tab, setTab] = React.useState<number>(0)

  function close() {
    onClose()
  }

  return (
    <Dialog isOpen={open} onClose={close} title={`Query ${reportNameMapping[report]} using API`} subtitle={`Use GraphQL to get access to a live feed of the underlying data of ${poolMetadata?.pool?.name}`}>
      <Tabs
        selectedIndex={tab}
        onChange={(index) => setTab(index)}
      >
        <TabsItem>Manually</TabsItem>
        <TabsItem>cURL</TabsItem>
      </Tabs>

      {tab === 0 ? (<>
        You can run the following query:
        <GraphqlCode>
          <GraphQLCodeBlock src={reportCodeMapping(pool.id)[report]} />
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
      </>) : (<>
        <GraphqlCode>
          curl -g -X POST \<br/>
            &nbsp; -H "Content-Type: application/json" \<br/>
            &nbsp; -d '&#123;"query": "{reportCodeMapping(pool.id)[report].replace(/(\r\n|\n|\r)/gm, "").replace(/[\""]/g, '\\"') }" &#125;' \<br/>
            &nbsp; {import.meta.env.REACT_APP_SUBQUERY_URL as string}
        </GraphqlCode>
        </>)}

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