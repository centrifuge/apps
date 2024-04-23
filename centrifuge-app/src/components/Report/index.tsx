import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Box, Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../../utils/date'
import { AssetList } from './AssetList'
import { AssetTransactions } from './AssetTransactions'
import { FeeTransactions } from './FeeTransactions'
import { Holders } from './Holders'
import { InvestorTransactions } from './InvestorTransactions'
import { PoolBalance } from './PoolBalance'
import { ReportContext } from './ReportContext'

export type TableDataRow = {
  name: string
  value: (string | number)[]
  heading?: boolean
}

export function ReportComponent({ pool }: { pool: Pool }) {
  const { report, startDate, endDate } = React.useContext(ReportContext)

  return (
    <Box pb={6}>
      <Shelf p={2} justifyContent="space-between">
        <Text as="span" variant="body3" color="textSecondary">
          {!['holders', 'asset-list'].includes(report) && (
            <>
              <time dateTime={startDate}>{formatDate(startDate)}</time>
              {' - '}
              <time dateTime={endDate}>{formatDate(endDate)}</time>
            </>
          )}
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
        {report === 'holders' && <Holders pool={pool} />}
        {report === 'investor-tx' && <InvestorTransactions pool={pool} />}
        {report === 'asset-tx' && <AssetTransactions pool={pool} />}
        {report === 'fee-tx' && <FeeTransactions pool={pool} />}
      </Box>
    </Box>
  )
}
