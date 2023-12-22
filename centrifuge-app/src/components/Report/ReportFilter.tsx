import { Pool } from '@centrifuge/centrifuge-js'
import { AnchorButton, Box, DateRange, Select, Shelf } from '@centrifuge/fabric'
import * as React from 'react'
import { GroupBy, Report, ReportContext } from './ReportContext'

type ReportFilterProps = {
  pool: Pool
}

export function ReportFilter({ pool }: ReportFilterProps) {
  const {
    csvData,
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
  } = React.useContext(ReportContext)

  const reportOptions: { label: string; value: Report }[] = [
    { label: 'Holders', value: 'holders' },
    { label: 'Investor transactions', value: 'investor-tx' },
    { label: 'Borrower transactions', value: 'borrower-tx' },
    { label: 'Pool balance', value: 'pool-balance' },
    { label: 'Asset list', value: 'asset-list' },
  ]

  return (
    <Shelf
      alignItems="center"
      flexWrap="wrap"
      gap={2}
      p={2}
      borderWidth={0}
      borderBottomWidth={1}
      borderStyle="solid"
      borderColor="borderSecondary"
    >
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

      {report !== 'holders' && (
        <DateRange
          end={endDate}
          onSelection={(start, end, range) => {
            setRange(range)
            setStartDate(start)
            setEndDate(end)
          }}
        />
      )}

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
            ...(range !== 'last-week'
              ? [
                  {
                    label: 'Month',
                    value: 'month',
                  },
                ]
              : []),
          ]}
          value={groupBy}
          onChange={(event) => {
            if (event.target.value) {
              setGroupBy(event.target.value as GroupBy)
            }
          }}
        />
      )}

      {(report === 'holders' || report === 'investor-tx') && (
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
      <Box ml="auto">
        <AnchorButton href={csvData?.dataUrl} download={csvData?.fileName} variant="primary" small disabled={!csvData}>
          Export CSV
        </AnchorButton>
      </Box>
    </Shelf>
  )
}
