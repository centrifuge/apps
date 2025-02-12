import { Rate } from '@centrifuge/centrifuge-js'
import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Box } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { AssetList } from './AssetList'
import { AssetTransactions } from './AssetTransactions'
import { BalanceSheet } from './BalanceSheet'
import { CashflowStatement } from './CashflowStatement'
import { FeeTransactions } from './FeeTransactions'
import { InvestorList } from './InvestorList'
import { InvestorTransactions } from './InvestorTransactions'
import { OracleTransactions } from './OracleTransactions'
import Orders from './Orders'
import { PoolBalance } from './PoolBalance'
import { ProfitAndLoss } from './ProfitAndLoss'
import { ReportContext } from './ReportContext'
import { TokenPrice } from './TokenPrice'

export type TableDataRow = {
  name: string
  value: (string | number | JSX.Element | Decimal | undefined | Rate)[]
  heading?: boolean
}

export function ReportComponent({ pool }: { pool: Pool }) {
  const { report } = React.useContext(ReportContext)

  return (
    <Box pb={6}>
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
        {report === 'orders' && <Orders pool={pool} />}
      </Box>
    </Box>
  )
}
