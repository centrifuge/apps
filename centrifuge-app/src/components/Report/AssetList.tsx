import { Loan, Pool } from '@centrifuge/centrifuge-js'
import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../../utils/date'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useLoans } from '../../utils/useLoans'
import { DataTable } from '../DataTable'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'

const noop = (v: any) => v
const headers = [
  'ID',
  'Status',
  'Outstanding',
  'Outstanding currency',
  'Total financed',
  'Total financed currency',
  'Total repaid',
  'Total repaid currency',
  'Financing date',
  'Maturity date',
  'Interest rate',
]
const align = ['left', 'left', 'right', 'left', 'right', 'left', 'right', 'left', 'left', 'left', 'left']
const csvOnly = [false, false, false, true, false, true, false, true, false, false, false]

export function AssetList({ pool }: { pool: Pool }) {
  const loans = useLoans(pool.id) as Loan[]
  const { setCsvData, loanStatus } = React.useContext(ReportContext)
  const { symbol } = pool.currency

  const cellFormatters = [
    noop,
    noop,
    (v: any) => (typeof v === 'number' ? formatBalance(v, symbol, 5) : '-'),
    noop,
    (v: any) => (typeof v === 'number' ? formatBalance(v, symbol, 5) : '-'),
    noop,
    (v: any) => (typeof v === 'number' ? formatBalance(v, symbol, 5) : '-'),
    noop,
    (v: any) => (v !== '-' ? formatDate(v) : v),
    formatDate,
    (v: any) => (typeof v === 'number' ? formatPercentage(v, true, undefined, 5) : '-'),
  ]

  const columns = headers
    .map((col, index) => ({
      align: align[index],
      header: col,
      cell: (row: TableDataRow) => <Text variant="body3">{cellFormatters[index]((row.value as any)[index])}</Text>,
    }))
    .filter((_, index) => !csvOnly[index])

  const data: TableDataRow[] = React.useMemo(() => {
    if (!loans) {
      return []
    }

    return loans
      .filter((loan) => loan.status !== 'Created')
      .map((loan) => ({
        name: '',
        value: [
          loan.id,
          loan.status === 'Closed' ? 'Repaid' : new Date() > new Date(loan.pricing.maturityDate) ? 'Overdue' : 'Active',
          'outstandingDebt' in loan ? loan.outstandingDebt.toFloat() : '-',
          symbol,
          'totalBorrowed' in loan ? loan.totalBorrowed.toFloat() : '-',
          symbol,
          'totalRepaid' in loan ? loan.totalRepaid.toFloat() : '-',
          symbol,
          'originationDate' in loan ? loan.originationDate : '-',
          loan.pricing.maturityDate,
          'interestRate' in loan.pricing ? loan.pricing.interestRate.toPercent().toNumber() : '-',
        ],
        heading: false,
      }))
      .filter((row) => (loanStatus === 'all' || !loanStatus ? true : row.value[1] === loanStatus))
  }, [loans, symbol, loanStatus])

  React.useEffect(() => {
    if (!data.length) {
      return
    }

    const formatted = data.map(({ value: values }) =>
      Object.fromEntries(headers.map((_, index) => [headers[index], `"${values[index]}"`]))
    )
    const dataUrl = getCSVDownloadUrl(formatted)

    setCsvData({
      dataUrl,
      fileName: `${pool.id}-asset-list-${loanStatus.toLowerCase()}.csv`,
    })

    return () => {
      setCsvData(undefined)
      URL.revokeObjectURL(dataUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  if (!loans) {
    return <Spinner />
  }

  return data.length > 0 ? <DataTable data={data} columns={columns} hoverable /> : <UserFeedback reportType="Assets" />
}
