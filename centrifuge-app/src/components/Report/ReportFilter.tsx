import { Pool } from '@centrifuge/centrifuge-js'
import { AnchorButton, Box, Card, DateInput, Select, Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { GroupBy, Report, ReportContext } from './ReportContext'

type ReportFilterProps = {
  pool: Pool
}

export function ReportFilter({ pool }: ReportFilterProps) {
  const {
    csvData,
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
  } = React.useContext(ReportContext)

  const reportOptions: { label: string; value: Report }[] = [
    { label: 'Pool balance', value: 'pool-balance' },
    { label: 'Asset list', value: 'asset-list' },
    { label: 'Investor transactions', value: 'investor-tx' },
    { label: 'Borrower transactions', value: 'borrower-tx' },
  ]

  React.useEffect(() => {
    setStartDate(pool?.createdAt ? new Date(pool?.createdAt) : new Date())
  }, [])

  return (
    <Stack as={Card} gap={2} p={2}>
      <Select
        name="report"
        label="Report"
        placeholder="Select a report"
        options={reportOptions}
        value={report}
        onChange={(event) => {
          if (event.target.value) {
            setReport(event.target.value as Report)
          }
        }}
      />

      <DateInput
        label="From date"
        value={startDate.toISOString().slice(0, 10)}
        onChange={(event) => setStartDate(new Date(event.target.value))}
      />

      <DateInput
        label="To date"
        value={endDate.toISOString().slice(0, 10)}
        onChange={(event) => setEndDate(new Date(event.target.value))}
      />

      {report === 'pool-balance' && (
        <Select
          name="groupBy"
          label="Group by"
          placeholder="Select a time period to group by"
          options={[
            {
              label: 'Day',
              value: 'day',
            },
            {
              label: 'Month',
              value: 'month',
            },
          ]}
          value={groupBy}
          onChange={(event) => {
            if (event.target.value) {
              setGroupBy(event.target.value as GroupBy)
            }
          }}
        />
      )}

      {report === 'investor-tx' && (
        <Select
          name="activeTranche"
          label="Token"
          placeholder="Select a token"
          options={[
            {
              label: 'All tokens',
              value: 'all',
            },
            ...pool.tranches.map((token) => {
              return {
                label: token.currency.name,
                value: token.id,
              }
            }),
          ]}
          value={activeTranche}
          onChange={(event) => {
            if (event.target.value) {
              setActiveTranche(event.target.value)
            }
          }}
        />
      )}
      <Box>
        <AnchorButton href={csvData?.dataUrl} download={csvData?.fileName} variant="primary" small disabled={!csvData}>
          Export CSV
        </AnchorButton>
      </Box>
    </Stack>
  )
}
