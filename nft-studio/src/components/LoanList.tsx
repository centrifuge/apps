import { Loan } from '@centrifuge/centrifuge-js'
import { IconChevronRight, Shelf, Text, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { nftMetadataSchema } from '../schemas'
import { daysBetween, formatAge, formatDate } from '../utils/date'
import { formatBalance } from '../utils/formatting'
import { useMetadata } from '../utils/useMetadata'
import { useNFT } from '../utils/useNFTs'
import { usePool } from '../utils/usePools'
import { Column, DataTable, SortableTableHeader } from './DataTable'
import LoanLabel, { getLoanLabelStatus } from './LoanLabel'

type Row = Loan & {
  amount?: number
  maturityDate: string | null
  statusLabel: string
}

type Props = {
  loans: Loan[]
  onLoanClicked: (loan: Loan) => void
}

const columns: Column[] = [
  {
    align: 'left',
    header: 'Asset',
    cell: (l: Row) => <AssetName loan={l} />,
    flex: '3',
  },
  {
    header: 'Maturity',
    cell: (l: Row) => (
      <Text variant="body2">
        {l.status === 'Active' &&
        'maturityDate' in l.loanInfo &&
        !l.interestRatePerSec.isZero() &&
        !l.totalBorrowed.isZero()
          ? formatAge(daysBetween(l.originationDate, l.loanInfo?.maturityDate))
          : ''}
      </Text>
    ),
    flex: '2',
  },
  {
    header: () => <SortableTableHeader label="Maturity date" />,
    cell: (l: Row) => <Text variant="body2">{l.maturityDate ? formatDate(l.maturityDate) : ''}</Text>,
    flex: '2',
    sortKey: 'maturityDate',
  },
  {
    header: () => <SortableTableHeader label="Amount" />,
    cell: (l: Row) => <AssetAmount loan={l} />,
    flex: '2',
    sortKey: 'amount',
  },
  {
    header: () => <SortableTableHeader label="Status" />,
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

export const LoanList: React.FC<Props> = ({ loans, onLoanClicked }) => {
  const Row: Row[] = loans.map((loan) => {
    return {
      amount: loan.loanInfo.value.toDecimal().toNumber(),
      statusLabel: getLoanLabelStatus(loan)[0],
      maturityDate: loan.status !== 'Created' && 'maturityDate' in loan.loanInfo ? loan.loanInfo.maturityDate : null,
      ...loan,
    }
  })
  return <DataTable data={Row} columns={columns} onRowClicked={onLoanClicked} />
}

const AssetName: React.VFC<{ loan: Row }> = ({ loan }) => {
  const nft = useNFT(loan.asset.collectionId, loan.asset.nftId)
  const { data: metadata } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  return (
    <Shelf gap="1" style={{ whiteSpace: 'nowrap', maxWidth: '100%' }}>
      <Thumbnail type="asset" label={loan.id} />
      <Text
        variant="body2"
        fontWeight={600}
        style={{ overflow: 'hidden', maxWidth: '300px', textOverflow: 'ellipsis' }}
      >
        {metadata?.name || 'Unnamed asset'}
      </Text>
    </Shelf>
  )
}

const AssetAmount: React.VFC<{ loan: Row }> = ({ loan }) => {
  const pool = usePool(loan.poolId)
  return <Text variant="body2">{loan?.amount ? formatBalance(loan.amount, pool?.currency) : ''}</Text>
}
