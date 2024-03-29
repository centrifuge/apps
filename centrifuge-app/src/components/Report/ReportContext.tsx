import { RangeOptionValue } from '@centrifuge/fabric'
import * as React from 'react'

export type GroupBy = 'day' | 'month'

export type Report = 'pool-balance' | 'asset-list' | 'investor-tx' | 'asset-tx' | 'fee-tx' | 'holders'

export type InvestorTxType = 'all' | 'orders' | 'executions' | 'transfers'

export type ReportContextType = {
  csvData?: CsvDataProps
  setCsvData: (data?: CsvDataProps) => void

  startDate: Date
  setStartDate: (date: Date) => void

  endDate: Date
  setEndDate: (date: Date) => void

  range: RangeOptionValue
  setRange: (range: RangeOptionValue) => void

  report: Report
  setReport: (report: Report) => void

  groupBy: GroupBy
  setGroupBy: (groupBy: GroupBy) => void

  activeTranche?: string
  setActiveTranche: (tranche: string) => void

  investorTxType: InvestorTxType
  setInvestorTxType: (investorTxType: InvestorTxType) => void
}

export type CsvDataProps = {
  dataUrl: string
  fileName: string
}

const defaultContext = {
  csvData: undefined,
  setCsvData() {},

  startDate: new Date(),
  setStartDate() {},

  endDate: new Date(),
  setEndDate() {},

  range: 'last-month' as RangeOptionValue,
  setRange() {},

  report: 'investor-tx' as Report,
  setReport() {},

  groupBy: 'month' as GroupBy,
  setGroupBy() {},

  activeTranche: 'all',
  setActiveTranche() {},

  investorTxType: 'all' as InvestorTxType,
  setInvestorTxType() {},
}

export const ReportContext = React.createContext<ReportContextType>(defaultContext)

export function ReportContextProvider({ children }: { children: React.ReactNode }) {
  const [csvData, setCsvData] = React.useState<CsvDataProps | undefined>(undefined)

  // Global filters
  const [startDate, setStartDate] = React.useState(defaultContext.startDate)
  const [endDate, setEndDate] = React.useState(defaultContext.endDate)
  const [report, setReport] = React.useState(defaultContext.report)
  const [range, setRange] = React.useState(defaultContext.range)

  // Custom filters for specific reports
  const [groupBy, setGroupBy] = React.useState(defaultContext.groupBy)
  const [activeTranche, setActiveTranche] = React.useState(defaultContext.activeTranche)
  const [investorTxType, setInvestorTxType] = React.useState(defaultContext.investorTxType)

  return (
    <ReportContext.Provider
      value={{
        csvData,
        setCsvData,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        range,
        setRange,
        report,
        setReport,
        groupBy,
        setGroupBy,
        activeTranche,
        setActiveTranche,
        investorTxType,
        setInvestorTxType,
      }}
    >
      {children}
    </ReportContext.Provider>
  )
}
