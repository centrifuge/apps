import { useBasePath } from '@centrifuge/centrifuge-app/src/utils/useBasePath'
import { CurrencyBalance, Loan, TinlakeLoan } from '@centrifuge/centrifuge-js'
import {
  Box,
  Pagination,
  PaginationContainer,
  Shelf,
  Stack,
  Text,
  TextWithPlaceholder,
  usePagination,
} from '@centrifuge/fabric'
import get from 'lodash/get'
import * as React from 'react'
import { useParams } from 'react-router'
import { nftMetadataSchema } from '../schemas'
import { formatDate } from '../utils/date'
import { formatBalance, formatPercentage } from '../utils/formatting'
import { useFilters } from '../utils/useFilters'
import { useMetadata } from '../utils/useMetadata'
import { useCentNFT } from '../utils/useNFTs'
import { useAllPoolAssetSnapshots, usePool } from '../utils/usePools'
import { Column, DataTable, SortableTableHeader } from './DataTable'
import { LoadBoundary } from './LoadBoundary'
import { prefetchRoute } from './Root'

type Row = (Loan | TinlakeLoan) & {
  idSortKey: number
  originationDateSortKey: string
  status: 'Created' | 'Active' | 'Closed' | ''
  maturityDate: string | null
  marketPrice: CurrencyBalance
  marketValue: CurrencyBalance
  unrealizedPL: CurrencyBalance
  realizedPL: CurrencyBalance
  portfolioPercentage: string
}

type Props = {
  loans: Loan[] | TinlakeLoan[]
}

export function LoanList({ loans }: Props) {
  const { pid: poolId } = useParams<{ pid: string }>()
  if (!poolId) throw new Error('Pool not found')

  const pool = usePool(poolId)
  const isTinlakePool = poolId?.startsWith('0x')
  const basePath = useBasePath()
  const snapshots = useAllPoolAssetSnapshots(pool.id, new Date().toString())
  const loansData = isTinlakePool
    ? loans
    : (loans ?? []).filter((loan) => 'valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'cash')

  const snapshotsValues =
    snapshots?.reduce((acc: { [key: string]: any }, snapshot) => {
      const id = snapshot.assetId.split('-')[1]
      acc[id] = {
        marketPrice: snapshot.currentPrice,
        marketValue: snapshot.presentValue,
        unrealizedPL: snapshot.unrealizedProfitAtMarketPrice,
        realizedPL: snapshot.sumRealizedProfitFifo,
      }
      return acc
    }, {}) ?? {}

  const totalMarketValue = Object.values(snapshotsValues).reduce((sum, snapshot) => {
    return sum + (snapshot.marketValue?.toDecimal().toNumber() ?? 0)
  }, 0)

  const loansWithLabelStatus = React.useMemo(() => {
    return loansData.sort((a, b) => {
      const aId = get(a, 'id') as string
      const bId = get(b, 'id') as string

      return aId.localeCompare(bId)
    })
  }, [isTinlakePool, loansData])

  const filters = useFilters({
    data: loansWithLabelStatus as Loan[],
  })

  React.useEffect(() => {
    prefetchRoute('/pools/1/assets/1')
  }, [])

  const rows: Row[] = filters.data.map((loan) => {
    const snapshot = snapshotsValues?.[loan.id]
    const marketValue = snapshot?.marketValue?.toDecimal().toNumber() ?? 0

    const portfolioPercentage =
      loan.status === 'Closed' || totalMarketValue === 0 ? 0 : (marketValue / totalMarketValue) * 100

    return {
      ...snapshot,
      nftIdSortKey: loan.asset.nftId,
      idSortKey: parseInt(loan.id, 10),
      outstandingDebtSortKey: loan.status !== 'Closed' && loan?.outstandingDebt?.toDecimal().toNumber(),
      originationDateSortKey:
        loan.status === 'Active' &&
        loan?.originationDate &&
        'interestRate' in loan.pricing &&
        !loan?.pricing.interestRate?.isZero() &&
        !loan?.totalBorrowed?.isZero()
          ? loan.originationDate
          : '',
      maturityDate: loan.pricing.maturityDate,
      portfolioPercentage,
      ...loan,
    }
  })

  const hasMaturityDate = rows.some((loan) => loan.maturityDate)

  const columns = [
    {
      align: 'left',
      header: <SortableTableHeader label={isTinlakePool ? 'NFT ID' : 'Asset'} />,
      cell: (l: Row) => <AssetName loan={l} />,
      sortKey: 'idSortKey',
    },

    {
      align: 'left',
      header: <SortableTableHeader label="Financing date" />,
      cell: (l: Row) => {
        if (l.poolId.startsWith('0x') && l.id !== '0') {
          return formatDate((l as TinlakeLoan).originationDate)
        }
        return l.status === 'Active' && 'valuationMethod' in l.pricing && l.pricing.valuationMethod !== 'cash'
          ? formatDate(l.originationDate)
          : '-'
      },
      sortKey: 'originationDateSortKey',
    },
    ...(hasMaturityDate
      ? [
          {
            align: 'left',
            header: <SortableTableHeader label="Maturity date" />,
            cell: (l: Row) => {
              if (l.poolId.startsWith('0x') && l.id !== '0' && l.maturityDate) {
                return formatDate(l.maturityDate)
              }
              return l?.maturityDate && 'valuationMethod' in l.pricing && l.pricing.valuationMethod !== 'cash'
                ? formatDate(l.maturityDate)
                : '-'
            },
            sortKey: 'maturityDate',
          },
        ]
      : []),
    ...(isTinlakePool
      ? []
      : [
          {
            align: 'left',
            header: <SortableTableHeader label="Amount" />,
            cell: (l: Row) => <Amount loan={l} />,
            sortKey: 'outstandingDebtSortKey',
          },
        ]),
    ...(isTinlakePool
      ? []
      : [
          {
            align: 'left',
            header: <SortableTableHeader label="Market price" />,
            cell: (l: Row) => formatBalance(l.marketPrice ?? '', pool.currency, 2, 0),
            sortKey: 'marketPriceSortKey',
          },
        ]),
    ...(isTinlakePool
      ? []
      : [
          {
            align: 'left',
            header: <SortableTableHeader label="Market value" />,
            cell: (l: Row) => formatBalance(l.marketValue ?? 0, pool.currency, 2, 0),
            sortKey: 'marketValueSortKey',
          },
        ]),
    ...(isTinlakePool
      ? []
      : [
          {
            align: 'left',
            header: <SortableTableHeader label="Unrealized P&L" />,
            cell: (l: Row) => formatBalance(l.unrealizedPL ?? '', pool.currency, 2, 0),
            sortKey: 'unrealizedPLSortKey',
          },
        ]),
    ...(isTinlakePool
      ? []
      : [
          {
            align: 'left',
            header: <SortableTableHeader label="Realized P&L" />,
            cell: (l: Row) => formatBalance(l.realizedPL ?? '', pool.currency, 2, 0),
            sortKey: 'realizedPLSortKey',
          },
        ]),
    ...(isTinlakePool
      ? []
      : [
          {
            align: 'left',
            header: <SortableTableHeader label="Portfolio" />,
            cell: (l: Row) => formatPercentage(l.portfolioPercentage ?? 0, true, undefined, 1),
            sortKey: 'portfolioSortKey',
            width: '80px',
          },
        ]),
  ].filter(Boolean) as Column[]

  const pagination = usePagination({ data: rows, pageSize: 20 })

  return (
    <PaginationContainer pagination={pagination}>
      <Stack gap={2}>
        <LoadBoundary>
          <Box overflow="auto">
            <DataTable
              data={rows}
              columns={columns}
              onRowClicked={(row) => `${basePath}/${poolId}/assets/${row.id}`}
              pageSize={20}
              page={pagination.page}
              defaultSortKey="maturityDate"
            />
          </Box>
        </LoadBoundary>
        {pagination.pageCount > 1 && (
          <Box alignSelf="center">
            <Pagination />
          </Box>
        )}
      </Stack>
    </PaginationContainer>
  )
}

export function AssetName({ loan }: { loan: Pick<Row, 'id' | 'poolId' | 'asset' | 'pricing'> }) {
  const isTinlakePool = loan.poolId.startsWith('0x')
  const nft = useCentNFT(loan.asset.collectionId, loan.asset.nftId, false, isTinlakePool)
  const { data: metadata, isLoading } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  if (loan.id === '0') return

  if (isTinlakePool) {
    return (
      <Shelf gap="1" alignItems="center" justifyContent="center" style={{ whiteSpace: 'nowrap', maxWidth: '100%' }}>
        <TextWithPlaceholder
          isLoading={isLoading}
          width={12}
          variant="body2"
          style={{ overflow: 'hidden', maxWidth: '300px', textOverflow: 'ellipsis' }}
        >
          {loan.asset.nftId.length >= 9
            ? `${loan.asset.nftId.slice(0, 4)}...${loan.asset.nftId.slice(-4)}`
            : loan.asset.nftId}
        </TextWithPlaceholder>
      </Shelf>
    )
  }

  return (
    <Shelf gap="1" alignItems="center" justifyContent="center" style={{ whiteSpace: 'nowrap', maxWidth: '100%' }}>
      <TextWithPlaceholder
        isLoading={isLoading}
        width={12}
        variant="body2"
        style={{ overflow: 'hidden', maxWidth: '300px', textOverflow: 'ellipsis' }}
      >
        {metadata?.name}
      </TextWithPlaceholder>
    </Shelf>
  )
}

function Amount({ loan }: { loan: Row }) {
  const pool = usePool(loan.poolId)

  function getAmount(l: Row) {
    switch (l.status) {
      case 'Closed':
        return formatBalance(l.totalRepaid)

      case 'Active':
        if ('presentValue' in l) {
          return formatBalance(l.presentValue)
        }

        if (l.outstandingDebt.isZero()) {
          return formatBalance(l.totalRepaid)
        }

        return formatBalance(l.outstandingDebt)

      // @ts-expect-error
      case '':
        return formatBalance(pool.reserve.total)

      default:
        return `0`
    }
  }

  return <Text style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{getAmount(loan)}</Text>
}
