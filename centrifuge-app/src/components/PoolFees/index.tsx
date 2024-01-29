import { Rate, TokenBalance } from '@centrifuge/centrifuge-js'
import { useCentrifugeQuery, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Shelf, Text, truncate } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory, useLocation, useParams } from 'react-router'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { usePool, usePoolMetadata } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { PageSection } from '../PageSection'
import { RouterLinkButton } from '../RouterLinkButton'
import { ChargeFeesDrawer } from './ChargeFeesDrawer'
import { EditFeesDrawer } from './EditFeesDrawer'

type Row = {
  name: string
  type?: string
  percentOfNav?: Rate
  pendingFees?: TokenBalance
  receivingAddress?: string
  action: null | React.ReactNode
  poolCurrency?: string
}

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
      return <Text variant="body3">{row.type === 'fixed' ? 'Fixed % of NAV' : 'Direct charge'}</Text>
    },
  },
  {
    align: 'right',
    header: 'Percentage',
    cell: (row: Row) => {
      return (
        <Text variant="body3">
          {row.percentOfNav ? `${formatPercentage(row.percentOfNav?.toDecimal())} of NAV` : ''}
        </Text>
      )
    },
  },
  {
    align: 'right',
    header: 'Pending fees',
    cell: (row: Row) => {
      return <Text variant="body3">{row.pendingFees ? formatBalance(row.pendingFees, row.poolCurrency, 2) : ''}</Text>
    },
  },
  {
    align: 'left',
    header: 'Receiving address',
    cell: (row: Row) => {
      return <Text variant="body3">{row.receivingAddress ? truncate(row.receivingAddress) : ''}</Text>
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

export function PoolFees() {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const { search, pathname } = useLocation()
  const { push } = useHistory()
  const params = new URLSearchParams(search)
  const [isChargeDrawerOpen, setIsChargeDrawerOpen] = React.useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = React.useState(false)
  const drawer = params.get('charge')
  const changes = useProposedFeeChanges(poolId)
  const { execute: applyNewFee } = useCentrifugeTransaction('Apply new fee', (cent) => cent.pools.applyNewFee)

  const data = React.useMemo(() => {
    const activeFees =
      pool.poolFees
        ?.filter((feeChainData) => poolMetadata?.pool?.poolFees?.find((f) => f.id === feeChainData.id))
        ?.map((feeChainData) => {
          const feeMetadata = poolMetadata?.pool?.poolFees?.find((f) => f.id === feeChainData.id)
          const fixedFee = feeChainData?.type === 'fixed'
          return {
            name: feeMetadata!.name,
            type: feeChainData?.type,
            percentOfNav: feeChainData?.amounts?.percentOfNav,
            pendingFees: fixedFee ? null : feeChainData?.amounts.pending,
            receivingAddress: feeChainData?.destination,
            action: fixedFee ? null : (
              <StyledLink to={`?charge=${feeChainData?.id}`}>
                <Text variant="body3">Charge</Text>
              </StyledLink>
            ),
            poolCurrency: pool.currency.symbol,
          }
        })
        .sort((a, b) => {
          if (a.type === 'fixed' && b.type !== 'fixed') return -1
          if (a.type !== 'fixed' && b.type === 'fixed') return 1
          return 0
        }) || []

    if (changes?.length) {
      return [
        ...activeFees,
        ...changes.map(({ change, hash }) => {
          console.log('🚀 ~ change:', change.amounts.percentOfNav)
          return {
            name: '',
            type: change.type,
            percentOfNav: change.amounts.percentOfNav,
            pendingFees: undefined,
            receivingAddress: change.destination,
            action: (
              <StyledLink
                style={{ outline: 'none', border: 'none', background: 'none' }}
                as="button"
                onClick={() => {
                  applyNewFee([poolId, hash])
                }}
              >
                <Text variant="body3">Apply changes</Text>
              </StyledLink>
            ),
            poolCurrency: pool.currency.symbol,
          }
        }),
      ]
    }

    return activeFees
  }, [poolMetadata, pool, poolId, changes, applyNewFee])

  React.useEffect(() => {
    if (drawer === 'edit') {
      setIsEditDrawerOpen(true)
    } else if (drawer) {
      setIsChargeDrawerOpen(true)
    }
  }, [drawer])

  return (
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
        {data?.length ? (
          <DataTable data={data || []} columns={columns} />
        ) : (
          <Shelf borderRadius="4px" backgroundColor="backgroundSecondary" justifyContent="center" p="10px">
            <Text color="textSecondary" variant="body2">
              No fees set yet
            </Text>
          </Shelf>
        )}
      </PageSection>
    </>
  )
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

export function useProposedFeeChanges(poolId: string) {
  const [result] = useCentrifugeQuery(['feeChanges', poolId], (cent) =>
    cent.pools.getProposedPoolSystemChanges([poolId])
  )

  const poolFeeChanges = React.useMemo(() => {
    return result
      ?.filter(({ change }) => !!change.poolFee?.appendFee?.length)
      .map(({ change, hash }) => {
        return {
          change: {
            destination: change.poolFee.appendFee[1].destination,
            type: Object.keys(change.poolFee.appendFee[1].feeType)[0],
            amounts: {
              percentOfNav: new Rate(change.poolFee.appendFee[1].feeType.chargedUpTo.limit.shareOfPortfolioValuation),
            },
          },
          hash,
        }
      })
  }, [result])

  return poolFeeChanges
}
