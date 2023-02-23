import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'
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

const GradientOverlay = styled.div`
  max-width: 960px;
  overflow: auto;
  background: linear-gradient(to right, #fff 20%, rgba(0, 0, 0, 0)),
    linear-gradient(to right, rgba(0, 0, 0, 0), #fff 80%) 0 100%, linear-gradient(to right, #000, rgba(0, 0, 0, 0) 20%),
    linear-gradient(to left, #000, rgba(0, 0, 0, 0) 20%);
  background-attachment: local, local, scroll, scroll;
`

export function ReportComponent({ pool }: { pool: Pool }) {
  const { report } = React.useContext(ReportContext)

  return (
    <Stack gap="2">
      <Stack gap="3">
        <GradientOverlay>
          {report === 'pool-balance' && <PoolBalance pool={pool} />}
          {report === 'asset-list' && <AssetList pool={pool} />}
          {report === 'investor-tx' && <InvestorTransactions pool={pool} />}
          {report === 'borrower-tx' && <BorrowerTransactions pool={pool} />}
        </GradientOverlay>
      </Stack>
      {(report === 'pool-balance' || report === 'asset-list') && pool && (
        <Text variant="body3" color="textSecondary">
          All amounts are in {pool.currency.symbol}.
        </Text>
      )}
    </Stack>
  )
}
