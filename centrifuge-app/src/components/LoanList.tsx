import { useBasePath } from '@centrifuge/centrifuge-app/src/utils/useBasePath'
import { CurrencyBalance, Loan, Rate, TinlakeLoan } from '@centrifuge/centrifuge-js'
import {
  Box,
  IconChevronRight,
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
import currencyDollar from '../assets/images/currency-dollar.svg'
import daiLogo from '../assets/images/dai-logo.svg'
import usdcLogo from '../assets/images/usdc-logo.svg'
import { formatNftAttribute } from '../pages/Loan/utils'
import { nftMetadataSchema } from '../schemas'
import { LoanTemplate, LoanTemplateAttribute } from '../types'
import { formatDate } from '../utils/date'
import { formatBalance } from '../utils/formatting'
import { useFilters } from '../utils/useFilters'
import { useMetadata } from '../utils/useMetadata'
import { useCentNFT } from '../utils/useNFTs'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { Column, DataTable, FilterableTableHeader, SortableTableHeader } from './DataTable'
import { LoadBoundary } from './LoadBoundary'
import { LoanLabel, getLoanLabelStatus } from './LoanLabel'
import { prefetchRoute } from './Root'
import { Tooltips } from './Tooltips'

type Row = (Loan | TinlakeLoan) & {
  idSortKey: number
  originationDateSortKey: string
  status: 'Created' | 'Active' | 'Closed' | ''
  maturityDate: string | null
}

type Props = {
  loans: Loan[] | TinlakeLoan[]
}

const getLoanStatus = (loan: Loan | TinlakeLoan) => {
  const [labelType, label] = getLoanLabelStatus(loan)

  if (label.includes('Due')) {
    return labelType === 'critical' ? 'Overdue' : 'Ongoing'
  }

  return label
}

export function LoanList({ loans }: Props) {
  const { pid: poolId } = useParams<{ pid: string }>()
  if (!poolId) throw new Error('Pool not found')

  const pool = usePool(poolId)
  const isTinlakePool = poolId?.startsWith('0x')
  const basePath = useBasePath()

  const { data: poolMetadata } = usePoolMetadata(pool)
  const templateIds = poolMetadata?.loanTemplates?.map((s) => s.id) ?? []
  const templateId = templateIds.at(-1)
  const { data: templateMetadata } = useMetadata<LoanTemplate>(templateId)
  const loansWithLabelStatus = React.useMemo(() => {
    return loans
      .filter((loan) => isTinlakePool || ('valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'cash'))
      .map((loan) => ({
        ...loan,
        labelStatus: getLoanStatus(loan),
      }))
      .sort((a, b) => {
        const aId = get(a, 'id') as string
        const bId = get(b, 'id') as string

        return aId.localeCompare(bId)
      })
  }, [isTinlakePool, loans])
  const filters = useFilters({
    data: loansWithLabelStatus,
  })

  React.useEffect(() => {
    prefetchRoute('/pools/1/assets/1')
  }, [])

  const additionalColumns: Column[] =
    templateMetadata?.keyAttributes?.map((key) => {
      const attr = templateMetadata.attributes![key]
      return {
        align: 'left',
        header: attr.label,
        cell: (l: Row) => <AssetMetadataField name={key} attribute={attr} loan={l} />,
      }
    }) || []

  const rows: Row[] = filters.data.map((loan) => ({
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
    ...loan,
  }))

  const hasMaturityDate = rows.some((loan) => loan.maturityDate)

  const columns = [
    {
      align: 'left',
      header: <SortableTableHeader label={isTinlakePool ? 'NFT ID' : 'Asset'} />,
      cell: (l: Row) => <AssetName loan={l} />,
      sortKey: 'idSortKey',
      width: 'minmax(300px, 1fr)',
    },
    ...(additionalColumns?.length
      ? additionalColumns
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
            sortKey: 'originationDateSortKey',
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
    {
      align: 'right',
      header: <SortableTableHeader label="Amount" />,
      cell: (l: Row) => <Amount loan={l} />,
      sortKey: 'outstandingDebtSortKey',
    },
    {
      align: 'left',
      header: (
        <FilterableTableHeader
          label="Status"
          filterKey="labelStatus"
          filters={filters}
          options={[...new Set(loansWithLabelStatus.map(({ labelStatus }) => labelStatus))]}
        />
      ),
      cell: (l: Row) => <LoanLabel loan={l} />,
      width: '100px',
    },
    {
      header: '',
      cell: (l: Row) => (l.status ? <IconChevronRight size={24} color="textPrimary" /> : ''),
      width: '52px',
    },
  ].filter(Boolean) as Column[]

  const pinnedData: Row[] = [
    {
      id: '0',
      // @ts-expect-error
      status: '',
      poolId: pool.id,
      pricing: {
        valuationMethod: 'discountedCashFlow',
        maxBorrowAmount: 'upToTotalBorrowed',
        value: CurrencyBalance.fromFloat(0, 18),
        maturityDate: '',
        maturityExtensionDays: 0,
        advanceRate: Rate.fromFloat(0),
        interestRate: Rate.fromFloat(0),
      },
      asset: { collectionId: '', nftId: '' },
      totalBorrowed: CurrencyBalance.fromFloat(0, 18),
      totalRepaid: CurrencyBalance.fromFloat(0, 18),
      outstandingDebt: CurrencyBalance.fromFloat(0, 18),
    },
    ...loans
      .filter((loan) => 'valuationMethod' in loan.pricing && loan.pricing.valuationMethod === 'cash')
      .map((loan) => {
        return {
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
          ...loan,
          maturityDate: loan.pricing.maturityDate,
        }
      }),
  ]

  const pagination = usePagination({ data: rows, pageSize: 20 })

  return (
    <PaginationContainer pagination={pagination}>
      <Stack gap={2}>
        <LoadBoundary>
          <Box overflow="auto" width="100%" borderWidth="0 1px" borderStyle="solid" borderColor="borderPrimary">
            <DataTable
              data={rows}
              columns={columns}
              onRowClicked={(row) => `${basePath}/${poolId}/assets/${row.id}`}
              pageSize={20}
              page={pagination.page}
              pinnedData={pinnedData}
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
  if (loan.id === '0') {
    return (
      <Shelf gap="1" alignItems="center" justifyContent="center" style={{ whiteSpace: 'nowrap', maxWidth: '100%' }}>
        <Shelf height="24px" width="24px" alignItems="center" justifyContent="center">
          <Box as="img" src={isTinlakePool ? daiLogo : usdcLogo} alt="" height="13px" width="13px" />
        </Shelf>
        <TextWithPlaceholder
          isLoading={isLoading}
          width={12}
          variant="body2"
          style={{ overflow: 'hidden', maxWidth: '300px', textOverflow: 'ellipsis' }}
        >
          <Tooltips type="onchainReserve" label={<Text variant="body2">Onchain reserve</Text>} />
        </TextWithPlaceholder>
      </Shelf>
    )
  }

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

  if ('valuationMethod' in loan.pricing && loan.pricing.valuationMethod === 'cash') {
    return (
      <Shelf gap="1" alignItems="center" justifyContent="center" style={{ whiteSpace: 'nowrap', maxWidth: '100%' }}>
        <Shelf height="24px" width="24px" alignItems="center" justifyContent="center">
          <Box as="img" src={currencyDollar} alt="" height="13px" width="13px" />
        </Shelf>
        <TextWithPlaceholder
          isLoading={isLoading}
          width={12}
          variant="body2"
          style={{ overflow: 'hidden', maxWidth: '300px', textOverflow: 'ellipsis' }}
        >
          <Tooltips type="offchainCash" label={<Text variant="body2">{metadata?.name}</Text>} />
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
        return formatBalance(l.totalRepaid, pool?.currency.symbol)

      case 'Active':
        if ('presentValue' in l) {
          return formatBalance(l.presentValue, pool?.currency.symbol)
        }

        if (l.outstandingDebt.isZero()) {
          return formatBalance(l.totalRepaid, pool?.currency.symbol)
        }

        return formatBalance(l.outstandingDebt, pool?.currency.symbol)

      // @ts-expect-error
      case '':
        return formatBalance(pool.reserve.total, pool?.currency.symbol)

      default:
        return `0 ${pool?.currency.symbol}`
    }
  }

  return <Text style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{getAmount(loan)}</Text>
}
