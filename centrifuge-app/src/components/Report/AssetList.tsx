import { Loan, Pool } from '@centrifuge/centrifuge-js'
import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../../utils/date'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useLoans } from '../../utils/useLoans'
import { DataTable, SortableTableHeader } from '../DataTable'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'

const noop = (v: any) => v
const valuationLabels = {
  discountedCashFlow: 'Non-fungible asset - DCF',
  outstandingDebt: 'Non-fungible asset - at par',
  oracle: 'Fungible asset - external pricing',
  cash: 'Cash',
}

export function AssetList({ pool }: { pool: Pool }) {
  const loans = useLoans(pool.id) as Loan[]
  const { setCsvData, loanStatus } = React.useContext(ReportContext)
  const { symbol } = pool.currency

  const columnConfig = [
    {
      header: 'ID',
      align: 'left',
      csvOnly: false,
      formatter: noop,
    },
    {
      header: 'Status',
      align: 'left',
      csvOnly: false,
      formatter: noop,
    },
    {
      header: 'Value',
      align: 'right',
      csvOnly: false,
      sortable: true,
      formatter: (v: any) => (typeof v === 'number' ? formatBalance(v, symbol, 2) : '-'),
    },
    {
      header: 'Value currency',
      align: 'left',
      csvOnly: true,
      formatter: noop,
    },
    {
      header: 'Outstanding',
      align: 'right',
      csvOnly: false,
      sortable: true,
      formatter: (v: any) => (typeof v === 'number' ? formatBalance(v, symbol, 2) : '-'),
    },
    {
      header: 'Outstanding currency',
      align: 'left',
      csvOnly: true,
      formatter: noop,
    },
    {
      header: 'Total financed',
      align: 'right',
      csvOnly: false,
      sortable: true,
      formatter: (v: any) => (typeof v === 'number' ? formatBalance(v, symbol, 2) : '-'),
    },
    {
      header: 'Total financed currency',
      align: 'left',
      csvOnly: true,
      formatter: noop,
    },
    {
      header: 'Total repaid',
      align: 'right',
      sortable: true,
      csvOnly: false,
      formatter: (v: any) => (typeof v === 'number' ? formatBalance(v, symbol, 2) : '-'),
    },
    {
      header: 'Total repaid currency',
      align: 'left',
      csvOnly: true,
      formatter: noop,
    },
    {
      header: 'Financing date',
      align: 'left',
      sortable: true,
      csvOnly: false,
      formatter: (v: any) => (v !== '-' ? formatDate(v) : v),
    },
    {
      header: 'Maturity date',
      align: 'left',
      csvOnly: false,
      sortable: true,
      formatter: formatDate,
    },
    {
      header: 'Interest rate',
      align: 'left',
      csvOnly: false,
      formatter: (v: any) => (typeof v === 'number' ? formatPercentage(v, true, undefined, 2) : '-'),
    },
    {
      header: 'Valuation method',
      align: 'left',
      csvOnly: false,
      formatter: noop,
    },
  ]

  const columns = columnConfig
    .map((col, index) => ({
      align: col.align,
      header: col.sortable ? <SortableTableHeader label={col.header} /> : col.header,
      sortKey: col.sortable ? `value[${index}]` : undefined,
      cell: (row: TableDataRow) => <Text variant="body3">{col.formatter((row.value as any)[index])}</Text>,
      csvOnly: col.csvOnly,
    }))
    .filter((col) => !col.csvOnly)

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
          loan.status === 'Closed'
            ? 'Repaid'
            : new Date() > new Date(loan.pricing.maturityDate)
            ? loan.outstandingDebt.isZero()
              ? 'Repaid'
              : 'Overdue'
            : 'Active',
          'presentValue' in loan ? loan.presentValue.toFloat() : '-',
          symbol,
          'outstandingDebt' in loan ? loan.outstandingDebt.toFloat() : '-',
          symbol,
          'totalBorrowed' in loan ? loan.totalBorrowed.toFloat() : '-',
          symbol,
          'totalRepaid' in loan ? loan.totalRepaid.toFloat() : '-',
          symbol,
          'originationDate' in loan ? loan.originationDate : '-',
          loan.pricing.maturityDate,
          'interestRate' in loan.pricing ? loan.pricing.interestRate.toPercent().toNumber() : '-',
          valuationLabels[loan.pricing.valuationMethod],
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
      Object.fromEntries(columnConfig.map((col, index) => [col.header, `"${values[index]}"`]))
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
