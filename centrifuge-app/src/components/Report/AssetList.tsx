import { Loan, Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
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

export function AssetList({ pool }: { pool: Pool }) {
  const loans = useLoans(pool.id) as Loan[]
  const { setCsvData, startDate, endDate } = React.useContext(ReportContext)

  const data: TableDataRow[] = React.useMemo(() => {
    if (!loans) {
      return []
    }

    return loans
      .filter((loan: Loan) => loan.status !== 'Created')
      .map((loan: Loan) => ({
        name: '',
        value: [
          loan.id,
          loan.status === 'Created' ? 'New' : loan.status,
          formatBalanceAbbreviated(loan.pricing.value.toDecimal(), pool.currency.symbol),
          'outstandingDebt' in loan
            ? formatBalanceAbbreviated(loan.outstandingDebt.toDecimal(), pool.currency.symbol)
            : '-',
          'totalBorrowed' in loan
            ? formatBalanceAbbreviated(loan.totalBorrowed.toDecimal(), pool.currency.symbol)
            : '-',
          'totalRepaid' in loan ? formatBalanceAbbreviated(loan.totalRepaid.toDecimal(), pool.currency.symbol) : '-',
          'originationDate' in loan ? formatDate(loan.originationDate) : '-',
          formatDate(loan.pricing.maturityDate),
          formatPercentage(loan.pricing.interestRate.toPercent()),
          formatPercentage(loan.pricing.advanceRate.toPercent()),
          loan.pricing.probabilityOfDefault ? formatPercentage(loan.pricing.probabilityOfDefault.toPercent()) : '-',
          loan.pricing.lossGivenDefault ? formatPercentage(loan.pricing.lossGivenDefault.toPercent()) : '-',
          loan.pricing.discountRate ? formatPercentage(loan.pricing.discountRate.toPercent()) : '-',
        ],
        heading: false,
      }))
  }, [loans])

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
  }, [dataUrl])

  if (!loans) {
    return <Spinner />
  }

  return data.length > 0 ? (
    <DataTable data={data} columns={columns} hoverable rounded={false} />
  ) : (
    <UserFeedback reportType="Assets" />
  )
}
