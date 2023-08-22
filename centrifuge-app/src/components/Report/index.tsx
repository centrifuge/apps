import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Box, Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../../utils/date'
import { AssetList } from './AssetList'
import { BorrowerTransactions } from './BorrowerTransactions'
import { InvestorTransactions } from './InvestorTransactions'
import { PoolBalance } from './PoolBalance'
import { ReportContext } from './ReportContext'

export type TableDataRow = {
  name: string | React.ReactElement
  value: string[] | React.ReactElement
  heading?: boolean
}

export function ReportComponent({ pool }: { pool: Pool }) {
  const { report, startDate, endDate } = React.useContext(ReportContext)

  return (
    <Box pb={6}>
      <Shelf p={2} justifyContent="space-between">
        <Text as="span" variant="body3" color="textSecondary">
          <time dateTime={startDate.toISOString()}>{formatDate(startDate)}</time>
          {' - '}
          <time dateTime={endDate.toISOString()}>{formatDate(endDate)}</time>
        </Text>
        {(report === 'pool-balance' || report === 'asset-list') && pool && (
          <Text as="span" variant="body3" color="textSecondary">
            All amounts are in {pool.currency.symbol}
          </Text>
        )}
      </Shelf>
      <Box overflow="auto" width="100%">
        {report === 'pool-balance' && <PoolBalance pool={pool} />}
        {report === 'asset-list' && <AssetList pool={pool} />}
        {report === 'investor-tx' && <InvestorTransactions pool={pool} />}
        {report === 'borrower-tx' && <BorrowerTransactions pool={pool} />}
      </Box>
    </Box>
  )
}
