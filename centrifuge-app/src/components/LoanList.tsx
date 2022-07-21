import { Loan } from '@centrifuge/centrifuge-js'
import { IconChevronRight, Shelf, Text, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams, useRouteMatch } from 'react-router'
import { nftMetadataSchema } from '../schemas'
import { formatDate } from '../utils/date'
import { formatBalance } from '../utils/formatting'
import { useMetadata } from '../utils/useMetadata'
import { useNFT } from '../utils/useNFTs'
import { usePool } from '../utils/usePools'
import { Column, DataTable, SortableTableHeader } from './DataTable'
import LoanLabel, { getLoanLabelStatus } from './LoanLabel'

type Row = Loan & {
  idSortKey: number
  maturityDate: string | null
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
    cell: (l: Row) => (
      <Text variant="body2">
        {l.originationDateSortKey && l.status === 'Active' && l?.originationDate ? formatDate(l.originationDate) : ''}
      </Text>
    ),
    flex: '2',
    sortKey: 'originationDateSortKey',
  },
  {
    header: <SortableTableHeader label="Maturity date" />,
    cell: (l: Row) => <Text variant="body2">{l.maturityDate ? formatDate(l.maturityDate) : ''}</Text>,
    flex: '2',
    sortKey: 'maturityDate',
  },
  {
    header: <SortableTableHeader label="Outstanding" />,
    cell: (l: Row) => <OutstandingDebt loan={l} />,
    flex: '2',
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

export const LoanList: React.FC<Props> = ({ loans }) => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const basePath = useRouteMatch(['/investments', '/issuer'])?.path || ''
  const rows: Row[] = loans.map((loan) => {
    return {
      statusLabel: getLoanLabelStatus(loan)[1],
      maturityDate: loan.status !== 'Created' && loan.loanInfo?.type !== 'CreditLine' ? loan.loanInfo.maturityDate : '',
      idSortKey: parseInt(loan.id, 10),
      outstandingDebtSortKey: loan.status !== 'Created' && loan?.outstandingDebt?.toDecimal().toNumber(),
      originationDateSortKey:
        loan.status !== 'Created' &&
        loan?.originationDate &&
        !loan?.interestRatePerSec?.isZero() &&
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

const AssetName: React.VFC<{ loan: Row }> = ({ loan }) => {
  const nft = useNFT(loan.asset.collectionId, loan.asset.nftId)
  const { data: metadata } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  console.log('🚀 ~ metadata', metadata)
  return (
    <Shelf gap="1" style={{ whiteSpace: 'nowrap', maxWidth: '100%' }}>
      <Thumbnail type="asset" label={loan.id} />
      <Text
        width={12}
        variant="body2"
        fontWeight={600}
        style={{ overflow: 'hidden', maxWidth: '300px', textOverflow: 'ellipsis' }}
      >
        {metadata?.name}
      </Text>
    </Shelf>
  )
}

const OutstandingDebt: React.VFC<{ loan: Row }> = ({ loan }) => {
  const pool = usePool(loan.poolId)

  return (
    <Text variant="body2">{loan.status !== 'Created' ? formatBalance(loan.outstandingDebt, pool?.currency) : ''}</Text>
  )
}
