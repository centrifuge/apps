import * as React from 'react'
import { useParams } from 'react-router'

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

export type ReportContextType = {
  csvData?: CsvDataProps
  setCsvData: (data?: CsvDataProps) => void

  startDate: string
  setStartDate: (date: string) => void

  endDate: string
  setEndDate: (date: string) => void

  report: Report
  setReport: (report: Report) => void

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
}

export type CsvDataProps = {
  dataUrl: string
  fileName: string
}

export const ReportContext = React.createContext<ReportContextType>({} as any)

export function ReportContextProvider({ children }: { children: React.ReactNode }) {
  const [csvData, setCsvData] = React.useState<CsvDataProps | undefined>(undefined)

  // Global filters
  const { report: reportParam } = useParams<{ report: string }>()

  React.useEffect(() => {
    if (reportParam === undefined) return
    setReport(reportParam as Report)
  }, [reportParam])

  const [report, setReport] = React.useState<Report | null>(null)

  const [startDate, setStartDate] = React.useState(
    new Date(new Date().getFullYear(), 0, 1, 1).toISOString().slice(0, 10)
  )
  const [endDate, setEndDate] = React.useState(new Date().toISOString().slice(0, 10))

  // Custom filters for specific reports
  const [loanStatus, setLoanStatus] = React.useState('all')
  const [groupBy, setGroupBy] = React.useState<GroupBy>('month')
  const [activeTranche, setActiveTranche] = React.useState('all')
  const [txType, setTxType] = React.useState('all')
  const [address, setAddress] = React.useState('')
  const [network, setNetwork] = React.useState<string | number>('all')
  const [loan, setLoan] = React.useState('all')

  return (
    <ReportContext.Provider
      value={{
        csvData,
        setCsvData,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        report,
        setReport,
        loanStatus,
        setLoanStatus,
        txType,
        setTxType,
        groupBy,
        setGroupBy,
        activeTranche,
        setActiveTranche,
        address,
        setAddress,
        network,
        setNetwork,
        loan,
        setLoan,
      }}
    >
      {children}
    </ReportContext.Provider>
  )
}
