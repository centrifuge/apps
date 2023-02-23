import * as React from 'react'

export type GroupBy = 'day' | 'month'

export type Report = 'pool-balance' | 'asset-list' | 'investor-tx' | 'borrower-tx'

export type ReportContext = {
  csvData?: CsvDataProps
  setCsvData: (data?: CsvDataProps) => void

  startDate: Date
  setStartDate: (date: Date) => void

  endDate: Date
  setEndDate: (date: Date) => void

  report: Report
  setReport: (report: Report) => void

  groupBy: GroupBy
  setGroupBy: (groupBy: GroupBy) => void

  activeTranche?: string
  setActiveTranche: (tranche: string) => void
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

  report: 'pool-balance' as Report,
  setReport() {},

  groupBy: 'day' as GroupBy,
  setGroupBy() {},

  activeTranche: 'all',
  setActiveTranche() {},
}

export const ReportContext = React.createContext<ReportContext>(defaultContext)

export function ReportContextProvider({ children }: { children: React.ReactNode }) {
  const [csvData, setCsvData] = React.useState<CsvDataProps | undefined>(undefined)

  // Global filters
  const [startDate, setStartDate] = React.useState(defaultContext.startDate)
  const [endDate, setEndDate] = React.useState(defaultContext.endDate)
  const [report, setReport] = React.useState(defaultContext.report)

  // Custom filters for specific reports
  const [groupBy, setGroupBy] = React.useState(defaultContext.groupBy)
  const [activeTranche, setActiveTranche] = React.useState(defaultContext.activeTranche)

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
        groupBy,
        setGroupBy,
        activeTranche,
        setActiveTranche,
      }}
    >
      {children}
    </ReportContext.Provider>
  )
}
