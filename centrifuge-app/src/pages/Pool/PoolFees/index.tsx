import { TokenBalance } from '@centrifuge/centrifuge-js'
import { Text, truncate } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { useHistory, useLocation, useParams } from 'react-router'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'
import { DataTable } from '../../../components/DataTable'
import { PageSection } from '../../../components/PageSection'
import { RouterLinkButton } from '../../../components/RouterLinkButton'
import { formatBalance, formatPercentage } from '../../../utils/formatting'
import { usePoolAdmin } from '../../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { ChargeFeesDrawer } from '../../IssuerPool/PoolFees/ChargeFeesDrawer'
import { EditFeesDrawer } from '../../IssuerPool/PoolFees/EditFeesDrawer'

type Row = {
  name: string
  type: string
  percentOfNav: Decimal
  pendingFees: TokenBalance
  receivingAddress: string
  action: null | React.ReactNode
  poolCurrency: string
}

const StyledLink = styled(NavLink)<{ $disabled?: boolean }>(
  {
    display: 'inline-block',
    outline: '0',
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
    },
  },
  (props) => props.$disabled && { pointerEvents: 'none' }
)

const columns = [
  {
    align: 'left',
    header: 'Name',
    cell: (row: Row) => {
      return <Text variant="body3">{row.name}</Text>
    },
  },
  {
    align: 'left',
    header: 'Type',
    cell: (row: Row) => {
      return <Text variant="body3">{row.type}</Text>
    },
  },
  {
    align: 'right',
    header: 'Percentage',
    cell: (row: Row) => {
      return <Text variant="body3">{formatPercentage(row.percentOfNav)} of NAV</Text>
    },
  },
  {
    align: 'right',
    header: 'Pending fees',
    cell: (row: Row) => {
      return <Text variant="body3">{formatBalance(row.pendingFees, row.poolCurrency)}</Text>
    },
  },
  {
    align: 'left',
    header: 'Receiving address',
    cell: (row: Row) => {
      return <Text variant="body3">{truncate(row.receivingAddress)}</Text>
    },
  },
  {
    align: 'left',
    header: 'Action',
    cell: (row: Row) => {
      return <Text variant="body3">{row.action}</Text>
    },
  },
]

export function PoolDetailOverview() {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const idAdmin = usePoolAdmin(poolId)
  const { search, pathname } = useLocation()
  const { push } = useHistory()
  const params = new URLSearchParams(search)
  const [isChargeDrawerOpen, setIsChargeDrawerOpen] = React.useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = React.useState(false)
  const drawer = params.get('charge')

  const data = React.useMemo(() => {
    return poolMetadata?.pool?.poolFees?.map((feeMatadata) => {
      const feeChainData = pool.poolFees?.find((f) => f.id === feeMatadata.id)
      const fixedFee = feeChainData?.type === 'fixed'
      return {
        name: feeMatadata.name,
        type: fixedFee ? 'Fixed % of NAV' : 'Direct charge',
        percentOfNav: feeChainData?.amounts?.percentOfNav.toDecimal(),
        pendingFees: feeChainData?.amounts.pending,
        receivingAddress: feeChainData?.destination,
        action: fixedFee ? null : (
          <StyledLink to={`?charge=${feeChainData?.id}`}>
            <Text variant="body3">Charge</Text>
          </StyledLink>
        ),
        poolCurrency: pool.currency.symbol,
      }
    })
  }, [poolMetadata])

  React.useEffect(() => {
    if (drawer === 'edit') {
      setIsEditDrawerOpen(true)
    } else if (drawer) {
      setIsChargeDrawerOpen(true)
    }
  }, [drawer])

  return idAdmin ? (
    <>
      <ChargeFeesDrawer
        isOpen={isChargeDrawerOpen}
        onClose={() => {
          setIsChargeDrawerOpen(false)
          push(pathname)
        }}
      />
      <EditFeesDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => {
          setIsEditDrawerOpen(false)
          push(pathname)
        }}
      />
      <PageSection
        title="Fee structure"
        headerRight={
          <RouterLinkButton variant="secondary" to={`?charge=edit`}>
            Edit fee structure
          </RouterLinkButton>
        }
      >
        <DataTable data={data || []} columns={columns} />
      </PageSection>
    </>
  ) : null
}
