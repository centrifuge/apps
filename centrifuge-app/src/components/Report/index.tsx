import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Box, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import styled from 'styled-components'
import { formatDate } from '../../utils/date'
import { PageSection } from '../PageSection'
import { AssetList } from './AssetList'
import { AssetTransactions } from './AssetTransactions'
import { BalanceSheet } from './BalanceSheet'
import { CashflowStatement } from './CashflowStatement'
import { FeeTransactions } from './FeeTransactions'
import { InvestorList } from './InvestorList'
import { InvestorTransactions } from './InvestorTransactions'
import { OracleTransactions } from './OracleTransactions'
import { PoolBalance } from './PoolBalance'
import { ProfitAndLoss } from './ProfitAndLoss'
import { ReportContext } from './ReportContext'
import { ReportFilter } from './ReportFilter'
import { TokenPrice } from './TokenPrice'

export type TableDataRow = {
  name: string
  value: (string | number | Decimal)[]
  heading?: boolean
}

const HoverableCard = styled(Stack)`
  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.cardInteractive};
  }
`

export function ReportComponent({ pool }: { pool: Pool }) {
  const { report, startDate, endDate } = React.useContext(ReportContext)

  const reports = [{ label: 'Balance sheet', description: 'Bla bla bla' }]

  if (!report) {
    return (
      <PageSection title="Choose a report">
        <Grid columns={[1, 2, 3, 4]} equalColumns gap={3} alignItems="start">
          {reports.map((report) => (
            <HoverableCard
              as="a"
              href={`/pools/${pool.id}/reporting/balance-sheet`}
              key={report.label}
              gap="10px"
              border="1px solid"
              borderColor="borderPrimary"
              p={1}
              pb={3}
              rel="noopener noreferrer"
              borderRadius="4px"
            >
              <Text variant="body2">{report.label}</Text>
              <Text variant="body3" color="textSecondary">
                {report.description}
              </Text>
            </HoverableCard>
          ))}
        </Grid>
      </PageSection>
    )
  }

  return (
    <Box pb={6}>
      {pool && <ReportFilter pool={pool} />}

      <Shelf p={2} justifyContent="space-between">
        <Text as="span" variant="body3" color="textSecondary">
          {!['investor-list', 'asset-list'].includes(report) && (
            <>
              {startDate ? formatDate(startDate) : 'The beginning of time'}
              {' - '}
              {endDate ? formatDate(endDate) : 'now'}
            </>
          )}
        </Text>
        {['pool-balance', 'asset-list'].includes(report) && pool && (
          <Text as="span" variant="body3" color="textSecondary">
            All amounts are in {pool.currency.symbol}
          </Text>
        )}
      </Shelf>
      <Box overflow="auto" width="100%">
        {report === 'pool-balance' && <PoolBalance pool={pool} />}
        {report === 'token-price' && <TokenPrice pool={pool} />}
        {report === 'asset-list' && <AssetList pool={pool} />}
        {report === 'investor-list' && <InvestorList pool={pool} />}
        {report === 'investor-tx' && <InvestorTransactions pool={pool} />}
        {report === 'asset-tx' && <AssetTransactions pool={pool} />}
        {report === 'fee-tx' && <FeeTransactions pool={pool} />}
        {report === 'balance-sheet' && <BalanceSheet pool={pool} />}
        {report === 'cash-flow-statement' && <CashflowStatement pool={pool} />}
        {report === 'oracle-tx' && <OracleTransactions pool={pool} />}
        {report === 'profit-and-loss' && <ProfitAndLoss pool={pool} />}
      </Box>
    </Box>
  )
}
