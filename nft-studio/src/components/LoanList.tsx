import { Loan } from '@centrifuge/centrifuge-js'
import { IconChevronRight, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useCentrifuge } from './CentrifugeProvider'
import { DataTable } from './DataTable'
import LoanLabel from './LoanLabel'

type Props = {
  loans: Loan[]
  onLoanClicked: (loan: Loan) => void
}

export const LoanList: React.FC<Props> = ({ loans, onLoanClicked }) => {
  const centrifuge = useCentrifuge()

  const columns = [
    {
      align: 'left',
      header: 'ID',
      cell: (l: Loan) => <Text fontWeight={600}>{l.id}</Text>,
      flex: '2 1 250px',
    },
    {
      header: 'Outstanding debt',
      cell: (l: Loan) => centrifuge.utils.formatCurrencyAmount(l.outstandingDebt),
    },
    {
      align: 'left',
      header: 'Status',
      cell: (l: Loan) => <LoanLabel loan={l} />,
    },
    {
      header: '',
      cell: () => <IconChevronRight size={24} color="textPrimary" />,
      flex: '0 0 72px',
    },
  ]

  return <DataTable data={loans} columns={columns} onRowClicked={onLoanClicked} />
}
