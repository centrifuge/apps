import { Loan, Pool, Rate } from '@centrifuge/centrifuge-js'
import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../../utils/date'
import { formatBalanceAbbreviated, formatPercentage } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useLoans } from '../../utils/useLoans'
import { DataTable } from '../DataTable'
import { Spinner } from '../Spinner'
import type { TableDataRow } from './index'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'

const headers = [
  'ID',
  'Status',
  'Collateral value',
  'Outstanding',
  'Total financed',
  'Total repaid',
  'Financing date',
  'Maturity date',
  'Financing fee',
  'Advance rate',
  'PD',
  'LGD',
  'Discount rate',
]

const columns = headers.map((col, index) => ({
  align: 'left',
  header: col,
  cell: (row: TableDataRow) => <Text variant="body2">{(row.value as any)[index]}</Text>,
  flex: index === 0 ? '0 0 50px' : '0 0 120px',
}))

export function AssetList({ pool }: { pool: Pool }) {
  const loans = useLoans(pool.id) as Loan[]
  const { setCsvData, startDate, endDate } = React.useContext(ReportContext)

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
          loan.status === 'Created' ? 'New' : loan.status,
          'value' in loan.pricing
            ? formatBalanceAbbreviated(loan.pricing.value.toDecimal(), pool.currency.symbol)
            : '-',
          'outstandingDebt' in loan
            ? formatBalanceAbbreviated(loan.outstandingDebt.toDecimal(), pool.currency.symbol)
            : '-',
          'totalBorrowed' in loan
            ? formatBalanceAbbreviated(loan.totalBorrowed.toDecimal(), pool.currency.symbol)
            : '-',
          'totalRepaid' in loan ? formatBalanceAbbreviated(loan.totalRepaid.toDecimal(), pool.currency.symbol) : '-',
          'originationDate' in loan ? formatDate(loan.originationDate) : '-',
          formatDate(loan.pricing.maturityDate),
          'interestRate' in loan.pricing ? formatPercentage(loan.pricing.interestRate.toPercent()) : '-',
          'advanceRate' in loan.pricing ? formatPercentage(loan.pricing.advanceRate.toPercent()) : '-',
          'probabilityOfDefault' in loan.pricing
            ? formatPercentage((loan.pricing.probabilityOfDefault as Rate).toPercent())
            : '-',
          'lossGivenDefault' in loan.pricing
            ? formatPercentage((loan.pricing.lossGivenDefault as Rate).toPercent())
            : '-',
          'discountRate' in loan.pricing ? formatPercentage((loan.pricing.discountRate as Rate).toPercent()) : '-',
        ],
        heading: false,
      }))
  }, [loans, pool.currency.symbol])

  const dataUrl = React.useMemo(() => {
    if (!data.length) {
      return
    }

    const formatted = data
      .map(({ value }) => value as string[])
      .map((values) => Object.fromEntries(headers.map((_, index) => [headers[index], `"${values[index]}"`])))

    return getCSVDownloadUrl(formatted)
  }, [data])

  React.useEffect(() => {
    setCsvData(
      dataUrl
        ? {
            dataUrl,
            fileName: `${pool.id}-asset-list-${startDate}-${endDate}.csv`,
          }
        : undefined
    )

    return () => setCsvData(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUrl, pool.id, startDate, endDate])

  if (!loans) {
    return <Spinner />
  }

  return data.length > 0 ? (
    <DataTable data={data} columns={columns} hoverable rounded={false} />
  ) : (
    <UserFeedback reportType="Assets" />
  )
}
