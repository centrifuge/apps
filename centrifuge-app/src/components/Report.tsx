import { ActiveLoan, Loan, Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'
import { LOAN_TYPE_LABELS } from '../pages/Loan/utils'
import { GroupBy, Report } from '../pages/Pool/Reporting'
import { formatDate } from '../utils/date'
import { formatBalance, formatPercentage } from '../utils/formatting'
import { useLoans } from '../utils/useLoans'
import { useDailyPoolStates, useInvestorTransactions, useMonthlyPoolStates, usePoolMetadata } from '../utils/usePools'
import { Column, DataTable } from './DataTable'
import { DataTableGroup } from './DataTableGroup'

export type ReportingMoment = {
  blockNumber: number
  timestamp: Date
}

export type CustomFilters = {
  groupBy: GroupBy
  activeTranche?: string
}

type Props = {
  pool: Pool
  report: Report
  exportRef: React.MutableRefObject<Function>
  customFilters: CustomFilters
  startDate: Date | undefined
  endDate: Date | undefined
}

type TableDataRow = {
  name: string | React.ReactElement
  value: string[] | React.ReactElement
  heading?: boolean
}

export const ReportComponent: React.FC<Props> = ({ pool, report, exportRef, customFilters, startDate, endDate }) => {
  const { data: metadata } = usePoolMetadata(pool)

  const dailyPoolStates = useDailyPoolStates(pool.id, startDate, endDate)
  const monthlyPoolStates = useMonthlyPoolStates(pool.id, startDate, endDate)

  const poolStates =
    report === 'pool-balance' ? (customFilters.groupBy === 'day' ? dailyPoolStates : monthlyPoolStates) : []
  const investorTransactions = useInvestorTransactions(
    pool.id,
    customFilters.activeTranche === 'all' ? undefined : customFilters.activeTranche
  )
  const loans = useLoans(pool.id)

  const columns: Column[] =
    report === 'pool-balance'
      ? poolStates
        ? [
            {
              align: 'left',
              header: '',
              cell: (row: TableDataRow) => <Text variant={row.heading ? 'heading4' : 'body2'}>{row.name}</Text>,
              flex: '1 0 200px',
            },
          ].concat(
            poolStates.map((state, index) => {
              return {
                align: 'right',
                header: `${new Date(state.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                })} ${
                  customFilters.groupBy === 'day'
                    ? new Date(state.timestamp).toLocaleDateString('en-US', { day: 'numeric' })
                    : new Date(state.timestamp).toLocaleDateString('en-US', { year: 'numeric' })
                }`,
                cell: (row: TableDataRow) => <Text variant="body2">{(row.value as any)[index]}</Text>,
                flex: '0 0 100px',
              }
            })
          )
        : []
      : report === 'asset-list'
      ? [
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
        ].map((col, index) => {
          return {
            align: 'left',
            header: col,
            cell: (row: TableDataRow) => <Text variant="body2">{(row.value as any)[index]}</Text>,
            flex: index === 0 ? '0 0 50px' : '0 0 100px',
          }
        })
      : [
          'Token',
          'Account',
          'Epoch',
          'Date',
          'Type',
          `${pool ? `${pool.currency.symbol} amount` : '—'}`,
          'Token amount',
          'Price',
        ].map((col, index) => {
          return {
            align: 'left',
            header: col,
            cell: (row: TableDataRow) => <Text variant="body2">{(row.value as any)[index]}</Text>,
            flex: index === 0 ? '0 0 150px' : index === 4 ? '0 0 200px' : '1',
          }
        })

  const exportToCsv = () => {
    const rows = [columns.map((col) => col.header.toString())]

    const mapText = (text: string) => text.replaceAll('\u00A0 \u00A0', '-')

    if (report === 'pool-balance') {
      overviewRecords.forEach((rec, index) => {
        rows.push(columns.map((col) => (col.cell(rec, index) ? mapText(textContent(col.cell(rec, index))) : '')))
      })
      rows.push([''])

      priceRecords.forEach((rec, index) => {
        rows.push(columns.map((col) => (col.cell(rec, index) ? mapText(textContent(col.cell(rec, index))) : '')))
      })
      rows.push([''])

      inOutFlowRecords.forEach((rec, index) => {
        rows.push(columns.map((col) => (col.cell(rec, index) ? mapText(textContent(col.cell(rec, index))) : '')))
      })
      rows.push([''])
    } else if (report === 'asset-list') {
      loanListRecords.forEach((rec, index) => {
        rows.push(columns.map((col) => (col.cell(rec, index) ? mapText(textContent(col.cell(rec, index))) : '')))
      })
    } else {
      investorTxRecords.forEach((rec, index) => {
        rows.push(columns.map((col) => (col.cell(rec, index) ? mapText(textContent(col.cell(rec, index))) : '')))
      })
      rows.push([''])
    }

    downloadCSV(rows, `${report}_${new Date().toISOString().slice(0, 10)}.csv`)
  }
  exportRef.current = exportToCsv

  const overviewRecords: TableDataRow[] = [
    {
      name: `Pool value`,
      value:
        poolStates?.map((state) => {
          return formatBalance(state.poolValue)
        }) || [],
      heading: false,
    },
  ].concat([
    {
      name: `Asset value`,
      value:
        poolStates?.map((state) => {
          return formatBalance(state.poolState.portfolioValuation.toDecimal())
        }) || [],
      heading: false,
    },
    {
      name: `Reserve`,
      value:
        poolStates?.map((state) => {
          return formatBalance(state.poolState.totalReserve.toDecimal())
        }) || [],
      heading: false,
    },
  ])

  const priceRecords: TableDataRow[] = [
    {
      name: `Token price`,
      value: poolStates?.map(() => '') || [],
      heading: false,
    },
  ].concat(
    pool?.tranches
      .slice()
      .reverse()
      .map((token) => {
        const trancheMeta = metadata?.tranches?.[token.id]
        return {
          name: `\u00A0 \u00A0 ${trancheMeta?.name} tranche`,
          value:
            poolStates?.map((state) => {
              return state.tranches[token.id].price
                ? formatBalance(state.tranches[token.id].price?.toFloat()!)
                : '1.000'
            }) || [],
          heading: false,
        }
      }) || []
  )

  const inOutFlowRecords: TableDataRow[] = [
    {
      name: `Investments`,
      value: poolStates?.map(() => '') || [],
      heading: false,
    },
  ].concat(
    pool?.tranches
      .slice()
      .reverse()
      .map((token) => {
        const trancheMeta = metadata?.tranches?.[token.id]
        return {
          name: `\u00A0 \u00A0 ${trancheMeta?.name} tranche`,
          value:
            poolStates?.map((state) => {
              return formatBalance(state.tranches[token.id].fulfilledInvestOrders.toDecimal())
            }) || [],
          heading: false,
        }
      }) || [],
    [
      {
        name: `Redemptions`,
        value: poolStates?.map(() => '') || [],
        heading: false,
      },
    ].concat(
      pool?.tranches
        .slice()
        .reverse()
        .map((token) => {
          const trancheMeta = metadata?.tranches?.[token.id]
          return {
            name: `\u00A0 \u00A0 ${trancheMeta?.name} tranche`,
            value:
              poolStates?.map((state) => {
                return formatBalance(state.tranches[token.id].fulfilledRedeemOrders.toDecimal())
              }) || [],
            heading: false,
          }
        }) || []
    )
  )

  const loanListRecords: TableDataRow[] =
    loans
      ?.filter((loan: Loan) => loan.status !== 'Created')
      .map((loan: Loan) => {
        return {
          name: ``,
          value: [
            loan.id,
            'loanInfo' in loan ? LOAN_TYPE_LABELS[loan.loanInfo.type] : '-',
            loan.status === 'Created' ? 'New' : loan.status,
            'loanInfo' in loan ? formatBalance(loan.loanInfo.value.toDecimal()) : '-',
            formatBalance((loan as ActiveLoan).outstandingDebt.toDecimal()),
            formatBalance((loan as ActiveLoan).totalBorrowed.toDecimal()),
            formatBalance((loan as ActiveLoan).totalRepaid.toDecimal()),
            loan.status !== 'Created' && loan.originationDate && Number(loan.originationDate) > 0
              ? formatDate(loan.originationDate.toString())
              : '-',
            loan.status !== 'Created' && 'maturityDate' in loan.loanInfo
              ? formatDate(loan.loanInfo.maturityDate.toString())
              : '-',
            'interestRatePerSec' in loan ? formatPercentage(loan.interestRatePerSec.toAprPercent()) : '-',
            'loanInfo' in loan ? formatPercentage(loan.loanInfo.advanceRate.toPercent()) : '-',
            loan.status !== 'Created' && 'probabilityOfDefault' in loan.loanInfo
              ? formatPercentage(loan.loanInfo.probabilityOfDefault.toPercent())
              : '-',
            loan.status !== 'Created' && 'lossGivenDefault' in loan.loanInfo
              ? formatPercentage(loan.loanInfo.lossGivenDefault.toPercent())
              : '-',
            loan.status !== 'Created' && 'discountRate' in loan.loanInfo
              ? formatPercentage(loan.loanInfo.discountRate.toPercent())
              : '-',
            // formatDate(loan.maturityDate.toString()),
          ],
          heading: false,
        }
      }) || []

  const investorTxRecords: TableDataRow[] =
    investorTransactions?.map((tx) => {
      const tokenId = tx.trancheId.split('-')[1]
      const trancheMeta = metadata?.tranches?.[tokenId]
      console.log('tx', tx)
      return {
        name: ``,
        value: [
          `${metadata?.pool?.name} ${trancheMeta?.name}`,
          tx.accountId,
          tx.epochNumber,
          formatDate(tx.timestamp.toString()),
          tx.type,
          formatBalance(tx.currencyAmount.toDecimal()),
          formatBalance(tx.tokenAmount.toDecimal()),
          tx.tokenPrice ? formatBalance(tx.tokenPrice.toDecimal(), pool.currency.symbol, 4) : '',
        ],
        heading: false,
      }
    }) || []

  return (
    <Stack gap="2">
      <Stack gap="3">
        <GradientOverlay>
          {report === 'pool-balance' && (
            <DataTableGroup>
              <DataTable data={overviewRecords} columns={columns} hoverable />
              <DataTable data={priceRecords} columns={columns} hoverable />
              <DataTable data={inOutFlowRecords} columns={columns} hoverable />
            </DataTableGroup>
          )}
          {report === 'asset-list' && <DataTable data={loanListRecords} columns={columns} hoverable />}
          {report === 'investor-tx' && <DataTable data={investorTxRecords} columns={columns} hoverable />}
        </GradientOverlay>
      </Stack>
      {(report === 'pool-balance' || report === 'asset-list') && pool && (
        <Text variant="body3" color="textSecondary">
          All amounts are in {pool.currency.symbol}.
        </Text>
      )}
    </Stack>
  )
}

const GradientOverlay = styled.div`
  max-width: 960px;
  overflow: auto;
  background: linear-gradient(to right, #fff 20%, rgba(0, 0, 0, 0)),
    linear-gradient(to right, rgba(0, 0, 0, 0), #fff 80%) 0 100%, linear-gradient(to right, #000, rgba(0, 0, 0, 0) 20%),
    linear-gradient(to left, #000, rgba(0, 0, 0, 0) 20%);
  background-attachment: local, local, scroll, scroll;
`

function textContent(elem: any): string {
  if (!elem) {
    return ''
  }
  if (typeof elem === 'string') {
    return elem
  }
  const children = elem.props && elem.props.children
  if (children instanceof Array) {
    return children.map(textContent).join('')
  }
  return textContent(children)
}

export const downloadCSV = (rows: any[], filename: string) => {
  const csvContent = `data:text/csv;charset=utf-8,${rows.map((e) => e.join(';')).join('\n')}`
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', filename)
  document.body.appendChild(link) // Required for FF

  link.click()
}
