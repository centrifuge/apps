// import { ActiveLoan, Loan, Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Loan, Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Text } from '@centrifuge/fabric'
import * as React from 'react'
// import { LOAN_TYPE_LABELS } from '../../pages/Loan/utils'
import { formatDate } from '../../utils/date'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useLoans } from '../../utils/useLoans'
import { DataTable } from '../DataTable'
import type { TableDataRow } from './index'
import { ReportContext } from './ReportContext'

export function AssetList({ pool }: { pool: Pool }) {
  const loans = useLoans(pool.id)
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
          // 'loanInfo' in loan ? LOAN_TYPE_LABELS[loan.loanInfo.type] : '-',
          loan.status === 'Created' ? 'New' : loan.status,
          // 'loanInfo' in loan ? formatBalance(loan.loanInfo.value.toDecimal()) : '-',
          // formatBalance((loan as ActiveLoan).outstandingDebt.toDecimal()),
          // formatBalance((loan as ActiveLoan).totalBorrowed.toDecimal()),
          // formatBalance((loan as ActiveLoan).totalRepaid.toDecimal()),
          // loan.status !== 'Created' && loan.originationDate && Number(loan.originationDate) > 0
          //   ? formatDate(loan.originationDate.toString())
          //   : '-',
          // loan.status !== 'Created' && 'maturityDate' in loan.loanInfo
          //   ? formatDate(loan.loanInfo.maturityDate.toString())
          //   : '-',
          // 'interestRatePerSec' in loan ? formatPercentage(loan.interestRatePerSec.toAprPercent()) : '-',
          // 'loanInfo' in loan ? formatPercentage(loan.loanInfo.advanceRate.toPercent()) : '-',
          // loan.status !== 'Created' && 'probabilityOfDefault' in loan.loanInfo
          //   ? formatPercentage(loan.loanInfo.probabilityOfDefault.toPercent())
          //   : '-',
          // loan.status !== 'Created' && 'lossGivenDefault' in loan.loanInfo
          //   ? formatPercentage(loan.loanInfo.lossGivenDefault.toPercent())
          //   : '-',
          // loan.status !== 'Created' && 'discountRate' in loan.loanInfo
          //   ? formatPercentage(loan.loanInfo.discountRate.toPercent())
          //   : '-',
          formatBalance(loan.pricing.value.toDecimal()),
          'outstandingDebt' in loan ? formatBalance(loan.outstandingDebt.toDecimal()) : '-',
          'totalBorrowed' in loan ? formatBalance(loan.totalBorrowed.toDecimal()) : '-',
          'totalRepaid' in loan ? formatBalance(loan.totalRepaid.toDecimal()) : '-',
          'originationDate' in loan ? formatDate(loan.originationDate) : '-',
          formatDate(loan.pricing.maturityDate),
          formatPercentage(loan.pricing.interestRate.toPercent()),
          formatPercentage(loan.pricing.advanceRate.toPercent()),
          loan.pricing.probabilityOfDefault ? formatPercentage(loan.pricing.probabilityOfDefault.toPercent()) : '-',
          loan.pricing.lossGivenDefault ? formatPercentage(loan.pricing.lossGivenDefault.toPercent()) : '-',
          loan.pricing.discountRate ? formatPercentage(loan.pricing.discountRate.toPercent()) : '-',
          // formatDate(loan.maturityDate.toString()),
        ],
        heading: false,
      }))
  }, [loans])

  const headers = [
    'ID',
    'Asset type',
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
    flex: index === 0 ? '0 0 50px' : '0 0 100px',
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

  return <DataTable data={data} columns={columns} hoverable rounded={false} />
}
