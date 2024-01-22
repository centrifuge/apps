import { TokenBalance } from '@centrifuge/centrifuge-js'
import { Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { useHistory, useLocation, useParams } from 'react-router'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'
import { DataTable } from '../../../components/DataTable'
import { PageSection } from '../../../components/PageSection'
import { RouterLinkButton } from '../../../components/RouterLinkButton'
import { Dec } from '../../../utils/Decimal'
import { formatBalance } from '../../../utils/formatting'
import { usePoolAdmin } from '../../../utils/usePermissions'
import { usePool } from '../../../utils/usePools'
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
      return <Text variant="body3">{row.percentOfNav.toString()}% of NAV</Text>
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
      return <Text variant="body3">{row.receivingAddress}</Text>
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

const data = [
  {
    name: 'Protocol fee',
    type: 'Fixed % of NAV',
    percentOfNav: Dec(0.5),
    pendingFees: Dec(0),
    receivingAddress: '0x1234...5678',
    action: null,
    poolCurrency: 'USDT',
  },
  {
    name: 'Managment fee',
    type: 'Fixed % of NAV',
    percentOfNav: Dec(0.5),
    pendingFees: Dec(0),
    receivingAddress: '0x1234...5678',
    action: null,
    poolCurrency: 'USDT',
  },
  {
    name: 'Priority fee',
    type: 'Direct charge',
    percentOfNav: Dec(0.5),
    pendingFees: Dec(0),
    receivingAddress: '0x1234...5678',
    action: (
      <StyledLink to={`?charge=priorityFee`}>
        <Text variant="body3">Charge</Text>
      </StyledLink>
    ),
    poolCurrency: 'USDT',
  },
  {
    name: 'Standard fee',
    type: 'Direct charge',
    percentOfNav: Dec(0.5),
    pendingFees: Dec(0),
    receivingAddress: '0x1234...5678',
    action: (
      <StyledLink to={`?charge=priorityFee`}>
        <Text variant="body3">Charge</Text>
      </StyledLink>
    ),
    poolCurrency: 'USDT',
  },
]

export function PoolDetailOverview() {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const idAdmin = usePoolAdmin(poolId)
  const { search, pathname } = useLocation()
  const { push } = useHistory()
  const params = new URLSearchParams(search)
  const [isChargeDrawerOpen, setIsChargeDrawerOpen] = React.useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = React.useState(false)
  const drawer = params.get('charge')

  React.useEffect(() => {
    if (drawer === 'edit') {
      setIsEditDrawerOpen(true)
    } else if (drawer === 'priorityFee' || drawer === 'standardFee') {
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
        <DataTable data={data} columns={columns} />
      </PageSection>
    </>
  ) : null
}
