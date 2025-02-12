import { BalanceSheetReport, CashflowReport, ProfitAndLossReport } from '@centrifuge/sdk/dist/types/reports'
import * as React from 'react'
import { useLocation, useParams } from 'react-router'
import { useSearchParams } from 'react-router-dom'

export type GroupBy = 'day' | 'month' | 'quarter' | 'year' | 'daily'

export type Report =
  | 'pool-balance'
  | 'token-price'
  | 'asset-list'
  | 'investor-tx'
  | 'asset-tx'
  | 'fee-tx'
  | 'oracle-tx'
  | 'investor-list'
  | 'balance-sheet'
  | 'cash-flow-statement'
  | 'profit-and-loss'
  | 'orders'

export type ReportContextType = {
  csvData?: CsvDataProps
  setCsvData: (data?: CsvDataProps) => void

  startDate: string
  setStartDate: (date: string) => void

  endDate: string
  setEndDate: (date: string) => void

  report: Report

  groupBy: GroupBy
  setGroupBy: (groupBy: GroupBy) => void

  loanStatus: string
  setLoanStatus: (status: string) => void

  txType: string
  setTxType: (type: string) => void

  activeTranche?: string
  setActiveTranche: (tranche: string) => void

  address: string
  setAddress: (type: string) => void

  network: string | number
  setNetwork: (type: string | number) => void

  loan: string
  setLoan: (type: string) => void

  reportData: CashflowReport[] | BalanceSheetReport[] | ProfitAndLossReport[]
  setReportData: (data: CashflowReport[] | BalanceSheetReport[] | ProfitAndLossReport[]) => void
}

export type CsvDataProps = {
  dataUrl: string
  fileName: string
}

export const ReportContext = React.createContext<ReportContextType>({} as any)

export function ReportContextProvider({ children }: { children: React.ReactNode }) {
  const [csvData, setCsvData] = React.useState<CsvDataProps | undefined>(undefined)

  // Global filters
  const { report: reportParam } = useParams<{ report: Report }>()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const report = reportParam ? reportParam : location.pathname.includes('reporting') ? 'balance-sheet' : 'investor-tx'

  const [startDate, setStartDate] = React.useState<string>('')
  const [endDate, setEndDate] = React.useState(new Date().toISOString().slice(0, 10))

  // Custom filters for specific reports
  const [loanStatus, setLoanStatus] = React.useState<string>(searchParams.get('loanStatus') || 'all')
  const [groupBy, setGroupBy] = React.useState<GroupBy>((searchParams.get('groupBy') as GroupBy) || 'month')
  const [activeTranche, setActiveTranche] = React.useState(searchParams.get('activeTranche') || 'all')
  const [txType, setTxType] = React.useState(searchParams.get('transactionType') || 'all')
  const [address, setAddress] = React.useState(searchParams.get('address') || '')
  const [network, setNetwork] = React.useState<string | number>(searchParams.get('network') || 'all')
  const [loan, setLoan] = React.useState(searchParams.get('loan') || '')
  const [reportData, setReportData] = React.useState<CashflowReport[] | BalanceSheetReport[] | ProfitAndLossReport[]>(
    []
  )

  React.useEffect(() => {
    const startDate = searchParams.get('from')
    const loan = searchParams.get('loanStatus')
    if (reportParam === 'asset-list') {
      setStartDate(startDate || new Date().toISOString().slice(0, 10))
      setLoanStatus(loan || 'ongoing')
    } else {
      setStartDate(
        startDate ||
          new Date(Date.UTC(new Date().getUTCFullYear() - 1, new Date().getUTCMonth(), new Date().getUTCDate()))
            .toISOString()
            .slice(0, 10)
      )
      setLoanStatus(loan || 'all')
    }
  }, [reportParam, setLoanStatus, setStartDate, searchParams])

  const updateParamValues = (key: string, value: any) => {
    const currentParams = new URLSearchParams()
    const params = Object.fromEntries([...searchParams])
    switch (key) {
      case 'groupBy':
        setGroupBy(value as GroupBy)
        if (value === 'quarter' || value === 'year') {
          delete params.from
          delete params.to
          currentParams.delete('to')
        }
        if (value === 'day') {
          delete params.to
        }
        currentParams.set('groupBy', value)
        break
      case 'token':
        setActiveTranche(value)
        currentParams.set('token', value)
        break
      case 'loanStatus':
        setLoanStatus(value)
        currentParams.set('loanStatus', value)
        break
      case 'txType':
        setTxType(value)
        currentParams.set('transactionType', value)
        break
      case 'address':
        setAddress(value)
        currentParams.set('address', value)
        break
      case 'network':
        setNetwork(value)
        currentParams.set('network', value)
        break
      case 'asset':
        setLoan(value)
        currentParams.set('asset', value)
        break
      case 'from':
        setStartDate(value)
        currentParams.set('from', value)
        break
      case 'to':
        setEndDate(value)
        currentParams.set('to', value)
        break
      default:
        break
    }

    setSearchParams({ ...params, ...Object.fromEntries(currentParams) })
  }

  return (
    <ReportContext.Provider
      value={{
        csvData,
        setCsvData,
        startDate,
        setStartDate: (value: string) => updateParamValues('from', value),
        endDate,
        setEndDate: (value) => updateParamValues('to', value),
        report,
        loanStatus,
        setLoanStatus: (value: string) => updateParamValues('loanStatus', value),
        txType,
        setTxType: (value: string) => updateParamValues('txType', value),
        groupBy,
        setGroupBy: (value: string) => updateParamValues('groupBy', value),
        activeTranche,
        setActiveTranche: (value: string) => updateParamValues('token', value),
        address,
        setAddress: (value: string) => updateParamValues('address', value),
        network,
        setNetwork: (value: any) => updateParamValues('network', value),
        loan,
        setLoan: (value: string) => updateParamValues('asset', value),
        reportData,
        setReportData,
      }}
    >
      {children}
    </ReportContext.Provider>
  )
}
