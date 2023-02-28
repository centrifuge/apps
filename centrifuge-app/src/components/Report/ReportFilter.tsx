import { Pool } from '@centrifuge/centrifuge-js'
import { AnchorButton, Box, DateRange, Select, Shelf } from '@centrifuge/fabric' // DateInput
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
    // const now = new Date()
    // setStartDate(new Date(now.setDate(now.getDate() - rangeOptions[1].days)))
    // setStartDate(pool?.createdAt ? new Date(pool?.createdAt) : new Date())
  }, [])

  return (
    <Shelf alignItems="center" flexWrap="wrap" gap={2} p={2} backgroundColor="backgroundSecondary">
      <Box minWidth={200} maxWidth={200}>
        <Select
          name="report"
          placeholder="Select a report"
          options={reportOptions}
          value={report}
          outlined={true}
          onChange={(event) => {
            if (event.target.value) {
              setReport(event.target.value as Report)
            }
          }}
        />
      </Box>

      <DateRange
        start={startDate}
        end={endDate}
        onSelection={(start, end) => {
          setStartDate(start)
          setEndDate(end)
        }}
      />

      {/* <Box minWidth={150} maxWidth={150}>
        <DateInput
          value={startDate.toISOString().slice(0, 10)}
          onChange={(event) => setStartDate(new Date(event.target.value))}
        />
      </Box>

      <Box minWidth={150} maxWidth={150}>
        <DateInput
          value={endDate.toISOString().slice(0, 10)}
          onChange={(event) => setEndDate(new Date(event.target.value))}
        />
      </Box> */}

      {report === 'pool-balance' && (
        <Box minWidth={150} maxWidth={150}>
          <Select
            name="groupBy"
            placeholder="Select a time period to group by"
            outlined={true}
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
        </Box>
      )}

      {report === 'investor-tx' && (
        <Box minWidth={150} maxWidth={150}>
          <Select
            name="activeTranche"
            placeholder="Select a token"
            outlined={true}
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
        </Box>
      )}
      <Box ml="auto">
        <AnchorButton
          href={csvData?.dataUrl}
          download={csvData?.fileName}
          variant="secondary"
          small
          disabled={!csvData}
        >
          Export CSV
        </AnchorButton>
      </Box>
    </Shelf>
  )
}
