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
import LoanLabel from './LoanLabel'

type Props = {
  loans: Loan[]
  onLoanClicked: (loan: Loan) => void
}

export const LoanList: React.FC<Props> = ({ loans, onLoanClicked }) => {
  const columns: Column[] = [
    {
      align: 'left',
      header: 'Asset',
      cell: (l: Loan) => <AssetName loan={l} />,
      flex: '3',
    },
    {
      header: 'Maturity',
      cell: (l: Loan) => (
        <Text variant="body2">
          {'maturityDate' in l.loanInfo && !l.interestRatePerSec.isZero() && !l.totalBorrowed.isZero()
            ? formatAge(daysBetween(l.originationDate, l.loanInfo?.maturityDate))
            : ''}
        </Text>
      ),
      flex: '2',
    },
    {
      header: 'Maturity Date',
      cell: (l: Loan) => (
        <Text variant="body2">{'maturityDate' in l.loanInfo ? formatDate(l.loanInfo.maturityDate) : ''}</Text>
      ),
      flex: '2',
    },
    {
      header: () => <SortableTableHeader label="Amount" />,
      cell: (l: Loan) => <AssetAmount loan={l} />,
      flex: '2',
      sortKey: 'principleDebt',
    },
    {
      header: 'Status',
      cell: (l: Loan) => <LoanLabel loan={l} />,
      flex: '2',
      align: 'center',
    },
    {
      header: '',
      cell: () => <IconChevronRight size={24} color="textPrimary" />,
      flex: '0 0 52px',
    },
  ]

  return <DataTable data={loans} columns={columns} onRowClicked={onLoanClicked} />
}

const AssetName: React.VFC<{ loan: Loan }> = ({ loan }) => {
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

const AssetAmount: React.VFC<{ loan: Loan }> = ({ loan }) => {
  const pool = usePool(loan.poolId)
  return <Text variant="body2">{formatBalance(loan.loanInfo.value, pool?.currency)}</Text>
}
