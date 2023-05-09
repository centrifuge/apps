import { Loan } from '@centrifuge/centrifuge-js'
import { IconChevronRight, Shelf, Text, TextWithPlaceholder, Thumbnail } from '@centrifuge/fabric'
import { useParams, useRouteMatch } from 'react-router'
import { nftMetadataSchema } from '../schemas'
import { formatDate } from '../utils/date'
import { formatBalance } from '../utils/formatting'
import { useAvailableFinancing } from '../utils/useLoans'
import { useMetadata } from '../utils/useMetadata'
import { useNFT } from '../utils/useNFTs'
import { usePool } from '../utils/usePools'
import { Column, DataTable, SortableTableHeader } from './DataTable'
import LoanLabel, { getLoanLabelStatus } from './LoanLabel'

type Row = Loan & {
  idSortKey: number
  statusLabel: string
  originationDateSortKey: string
}

type Props = {
  loans: Loan[]
}

const columns: Column[] = [
  {
    align: 'left',
    header: <SortableTableHeader label="Asset" />,
    cell: (l: Row) => <AssetName loan={l} />,
    flex: '3',
    sortKey: 'idSortKey',
  },
  {
    header: <SortableTableHeader label="Financing date" />,
    cell: (l: Row) => (l.originationDateSortKey && l.status === 'Active' ? formatDate(l.originationDate) : ''),
    flex: '2',
    sortKey: 'originationDateSortKey',
  },
  {
    header: <SortableTableHeader label="Maturity date" />,
    cell: (l: Row) => (l.pricing.maturityDate ? formatDate(l.pricing.maturityDate) : ''),
    flex: '2',
    sortKey: 'maturityDate',
  },
  {
    header: <SortableTableHeader label="Amount" />,
    cell: (l: Row) => <Amount loan={l} />,
    flex: '3',
    sortKey: 'outstandingDebtSortKey',
  },
  {
    header: <SortableTableHeader label="Status" />,
    cell: (l: Row) => <LoanLabel loan={l} />,
    flex: '2',
    align: 'center',
    sortKey: 'statusLabel',
  },
  {
    header: '',
    cell: () => <IconChevronRight size={24} color="textPrimary" />,
    flex: '0 0 52px',
  },
]

export function LoanList({ loans }: Props) {
  const { pid: poolId } = useParams<{ pid: string }>()
  const basePath = useRouteMatch(['/pools', '/issuer'])?.path || ''
  const rows: Row[] = loans.map((loan) => {
    return {
      statusLabel: getLoanLabelStatus(loan)[1],
      idSortKey: parseInt(loan.id, 10),
      outstandingDebtSortKey: loan.status !== 'Closed' && loan?.outstandingDebt?.toDecimal().toNumber(),
      originationDateSortKey:
        loan.status === 'Active' &&
        loan?.originationDate &&
        !loan?.pricing.interestRate?.isZero() &&
        !loan?.totalBorrowed?.isZero()
          ? loan.originationDate
          : '',
      ...loan,
    }
  })
  return (
    <DataTable
      data={rows}
      columns={columns}
      defaultSortKey="idSortKey"
      defaultSortOrder="asc"
      onRowClicked={(row) => `${basePath}/${poolId}/assets/${row.id}`}
    />
  )
}

function AssetName({ loan }: { loan: Row }) {
  const nft = useNFT(loan.asset.collectionId, loan.asset.nftId)
  const { data: metadata, isLoading } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  return (
    <Shelf gap="1" style={{ whiteSpace: 'nowrap', maxWidth: '100%' }}>
      <Thumbnail type="asset" label={loan.id} />
      <TextWithPlaceholder
        isLoading={isLoading}
        width={12}
        variant="body2"
        fontWeight={600}
        style={{ overflow: 'hidden', maxWidth: '300px', textOverflow: 'ellipsis' }}
      >
        {metadata?.name}
      </TextWithPlaceholder>
    </Shelf>
  )
}

function Amount({ loan }: { loan: Row }) {
  const pool = usePool(loan.poolId)
  const { current } = useAvailableFinancing(loan.poolId, loan.id)

  function getAmount(l: Row) {
    switch (l.status) {
      case 'Closed':
        return formatBalance(l.totalRepaid, pool?.currency.symbol)

      case 'Active':
        if (l.pricing.interestRate?.gtn(0) && l.totalBorrowed?.isZero()) {
          return formatBalance(current, pool?.currency.symbol)
        }

        if (l.outstandingDebt.isZero()) {
          return formatBalance(l.totalRepaid, pool?.currency.symbol)
        }

        return formatBalance(l.outstandingDebt, pool?.currency.symbol)

      default:
        return ''
    }
  }

  return <Text style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{getAmount(loan)}</Text>
}
