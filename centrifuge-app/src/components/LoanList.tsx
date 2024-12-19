import { useBasePath } from '@centrifuge/centrifuge-app/src/utils/useBasePath'
import { CurrencyBalance, Loan, Pool, TinlakeLoan } from '@centrifuge/centrifuge-js'
import {
  AnchorButton,
  Box,
  Button,
  Checkbox,
  IconDownload,
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
import { useNavigate, useParams } from 'react-router'
import { TinlakePool } from 'src/utils/tinlake/useTinlakePools'
import { formatNftAttribute } from '../../src/pages/Loan/utils'
import { LoanTemplate, LoanTemplateAttribute } from '../../src/types'
import { getCSVDownloadUrl } from '../../src/utils/getCSVDownloadUrl'
import { nftMetadataSchema } from '../schemas'
import { formatDate } from '../utils/date'
import { formatBalance, formatPercentage } from '../utils/formatting'
import { useFilters } from '../utils/useFilters'
import { useMetadata } from '../utils/useMetadata'
import { useCentNFT } from '../utils/useNFTs'
import { useAllPoolAssetSnapshots, usePool, usePoolMetadata } from '../utils/usePools'
import { Column, DataTable, SortableTableHeader } from './DataTable'
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

  const navigate = useNavigate()
  const { data: snapshots } = useAllPoolAssetSnapshots(poolId, new Date().toISOString().slice(0, 10))
  const pool = usePool(poolId)
  const isTinlakePool = poolId?.startsWith('0x')
  const basePath = useBasePath()
  const loansData = isTinlakePool
    ? loans
    : (loans ?? []).filter((loan) => 'valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'cash')
  const { data: poolMetadata } = usePoolMetadata(pool)
  const templateIds = poolMetadata?.loanTemplates?.map((s) => s.id) ?? []
  const templateId = templateIds.at(-1)
  const { data: templateMetadata } = useMetadata<LoanTemplate>(templateId)
  const [showRepaid, setShowRepaid] = React.useState(false)

  const additionalColumns: Column[] =
    templateMetadata?.keyAttributes?.map((key, index) => {
      const attr = templateMetadata.attributes![key]
      return {
        align: 'left',
        header: <SortableTableHeader label={attr.label} />,
        cell: (l: Row) => <AssetMetadataField name={key} attribute={attr} loan={l} />,
        sortKey: attr.label.toLowerCase(),
      }
    }) || []

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
  }, [loansData])

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
      sortKey: 'id',
    },
    ...(additionalColumns?.length
      ? additionalColumns.filter((attr) => attr.sortKey !== 'term')
      : [
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
            sortKey: 'originationDate',
          },
        ]),
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
            header: <SortableTableHeader label="Quantity" />,
            cell: (l: Row) => <Amount loan={l} />,
            sortKey: 'outstandingDebt',
          },
        ]),
    ...(isTinlakePool
      ? []
      : [
          {
            align: 'left',
            header: <SortableTableHeader label="Market price" />,
            cell: (l: Row) => formatBalance(l.marketPrice ?? 0, pool.currency, 4, 0),
            sortKey: 'marketPrice',
          },
        ]),
    ...(isTinlakePool
      ? []
      : [
          {
            align: 'left',
            header: <SortableTableHeader label="Market value" />,
            cell: (l: Row) => formatBalance(l.marketValue ?? 0, pool.currency, 2, 0),
            sortKey: 'marketValue',
          },
        ]),
    ...(isTinlakePool
      ? []
      : [
          {
            align: 'left',
            header: <SortableTableHeader label="Unrealized P&L" />,
            cell: (l: Row) => formatBalance(l.unrealizedPL ?? 0, pool.currency, 2, 0),
            sortKey: 'unrealizedPL',
            width: '140px',
          },
        ]),
    ...(isTinlakePool
      ? []
      : [
          {
            align: 'left',
            header: <SortableTableHeader label="Realized P&L" />,
            cell: (l: Row) => formatBalance(l.realizedPL ?? 0, pool.currency, 2, 0),
            sortKey: 'realizedPL',
            width: '140px',
          },
        ]),
    ...(isTinlakePool
      ? []
      : [
          {
            align: 'left',
            header: <SortableTableHeader label="Portfolio %" />,
            cell: (l: Row) => formatPercentage(l.portfolioPercentage ?? 0, true, undefined, 1),
            sortKey: 'portfolioPercentage',
          },
        ]),
  ].filter(Boolean) as Column[]

  const csvData = React.useMemo(() => {
    if (!rows.length) return undefined

    return rows.map((loan) => {
      const quantity = getAmount(loan, pool)

      return {
        'Asset ID': loan.id,
        'Maturity Date': loan.maturityDate ? loan.maturityDate : '-',
        Quantity: `${quantity ?? '-'}`,
        'Market Price': loan.marketPrice ? loan.marketPrice : '-',
        'Market Value': loan.marketValue ? loan.marketValue : '-',
        'Unrealized P&L': loan.unrealizedPL ? loan.unrealizedPL : '-',
        'Realized P&L': loan.realizedPL ? loan.realizedPL : '-',
        'Portfolio %': loan.portfolioPercentage ? loan.portfolioPercentage : '-',
      }
    })
  }, [rows, pool])

  const csvUrl = React.useMemo(() => csvData && getCSVDownloadUrl(csvData as any), [csvData])
  const filteredData = isLoading ? [] : showRepaid ? rows : rows.filter((row) => !row.marketValue?.isZero())
  const pagination = usePagination({ data: filteredData, pageSize: 20 })

  return (
    <>
      <Box pt={1} pb={2} paddingX={1} display="flex" justifyContent="space-between" alignItems="center">
        <Text variant="heading4">{rows.filter((row) => !row.marketValue?.isZero()).length} ongoing assets</Text>
        <Box display="flex" alignItems="center">
          <Box mr={2}>
            <Checkbox
              label={
                <Text color="textSecondary" variant="body2">
                  Show closed assets
                </Text>
              }
              onChange={(e) => setShowRepaid(!showRepaid)}
            />
          </Box>
          <Button
            variant="inverted"
            style={{ marginRight: 12 }}
            small
            onClick={() => navigate(`${basePath}/${poolId}/data/asset-tx`)}
          >
            View asset transactions
          </Button>
          <AnchorButton
            href={csvUrl ?? ''}
            download={`pool-assets-${poolId}.csv`}
            variant="inverted"
            icon={IconDownload}
            small
            target="_blank"
            style={{ marginLeft: 8 }}
          >
            Download
          </AnchorButton>
        </Box>
      </Box>
      <PaginationContainer pagination={pagination}>
        <Stack gap={2}>
          <Box overflow="auto">
            <DataTable
              data={filteredData}
              columns={columns}
              onRowClicked={(row) => `${basePath}/${poolId}/assets/${row.id}`}
              pageSize={20}
              page={pagination.page}
              defaultSortKey="maturityDate"
            />
          </Box>
          {pagination.pageCount > 1 && (
            <Box alignSelf="center">
              <Pagination />
            </Box>
          )}
        </Stack>
      </PaginationContainer>
    </>
  )
}

function AssetMetadataField({ loan, name, attribute }: { loan: Row; name: string; attribute: LoanTemplateAttribute }) {
  const isTinlakePool = loan.poolId.startsWith('0x')
  const nft = useCentNFT(loan.asset.collectionId, loan.asset.nftId, false, isTinlakePool)
  const { data: metadata, isLoading } = useMetadata(nft?.metadataUri, nftMetadataSchema)

  return (
    <Shelf gap="1" style={{ whiteSpace: 'nowrap', maxWidth: '100%' }}>
      <TextWithPlaceholder
        isLoading={isLoading}
        width={12}
        variant="body2"
        style={{ overflow: 'hidden', maxWidth: '300px', textOverflow: 'ellipsis' }}
      >
        {metadata?.properties?.[name] ? formatNftAttribute(metadata?.properties?.[name], attribute) : '-'}
      </TextWithPlaceholder>
    </Shelf>
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
          variant="heading4"
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
        variant="heading4"
        style={{ overflow: 'hidden', maxWidth: '300px', textOverflow: 'ellipsis' }}
      >
        {metadata?.name}
      </TextWithPlaceholder>
    </Shelf>
  )
}

export function getAmount(l: Row, pool: Pool | TinlakePool, format?: boolean, isPresentValue?: boolean) {
  switch (l.status) {
    case 'Closed':
      return format ? formatBalance(l.totalRepaid) : l.totalRepaid

    case 'Active':
      if ('outstandingQuantity' in l.pricing && !isPresentValue) {
        return format ? formatBalance(l.pricing.outstandingQuantity) : l.pricing.outstandingQuantity
      }

      if ('presentValue' in l && isPresentValue) {
        return format ? formatBalance(l.presentValue) : l.presentValue
      }

      if (l.outstandingDebt.isZero()) {
        return format ? formatBalance(l.totalRepaid) : l.totalRepaid
      }

      return format ? formatBalance(l.outstandingDebt) : l.outstandingDebt

    // @ts-expect-error
    case '':
      return format ? formatBalance(pool.reserve.total) : pool.reserve.total

    default:
      return `0`
  }
}

function Amount({ loan }: { loan: Row }) {
  const pool = usePool(loan.poolId)
  return <Text style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{getAmount(loan, pool, true)}</Text>
}
