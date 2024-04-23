import * as React from 'react'

export type GroupBy = 'day' | 'month'

export type Report = 'pool-balance' | 'asset-list' | 'investor-tx' | 'asset-tx' | 'fee-tx' | 'holders'

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
  const [startDate, setStartDate] = React.useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  )
  const [endDate, setEndDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [report, setReport] = React.useState<Report>('investor-tx')

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
