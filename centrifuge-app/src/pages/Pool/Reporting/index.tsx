import { Pool } from '@centrifuge/centrifuge-js'
import { Button, Card, DateInput, InputGroup, RadioButton, Select, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageSection } from '../../../components/PageSection'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { CustomFilters, ReportComponent } from '../../../components/Report'
import { Spinner } from '../../../components/Spinner'
import { formatDate } from '../../../utils/date'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

export type GroupBy = 'day' | 'month'

export type Report = 'pool-balance' | 'asset-list' | 'investor-tx'

const titleByReport: { [key: string]: string } = {
  'pool-balance': 'Pool balance',
  'asset-list': 'Asset list',
  'investor-tx': 'Investor transactions',
}

export const PoolDetailReportingTab: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)

  // Global filters
  const [startDate, setStartDate] = React.useState(pool?.createdAt ? new Date(pool?.createdAt) : new Date())
  const [endDate, setEndDate] = React.useState(new Date())
  const [report, setReport] = React.useState('pool-balance' as Report)

  // Custom filters for specific reports
  const [groupBy, setGroupBy] = React.useState('day' as GroupBy)
  const [activeTranche, setActiveTranche] = React.useState(undefined as string | undefined)

  const exportRef = React.useRef<() => void>(() => {})

  const reportOptions: { label: string; value: Report }[] = [
    { label: 'Pool balance', value: 'pool-balance' },
    { label: 'Asset list', value: 'asset-list' },
    { label: 'Investor transactions', value: 'investor-tx' },
  ]

  return (
    <PageWithSideBar
      sidebar={
        <Stack gap={2}>
          <Stack as={Card} gap={2} p={2}>
            <Text variant="heading3">Switch report</Text>

            <Select
              placeholder="Select a report"
              options={reportOptions}
              value={report}
              onSelect={(newReport) => {
                if (newReport) {
                  setReport(newReport as Report)
                }
              }}
            />
          </Stack>
          <Stack as={Card} gap={2} p={2}>
            <Text variant="heading3">Filter</Text>
            <Shelf gap={2}>
              <Text>From</Text>
              <DateInput
                value={startDate.toISOString().slice(0, 10)}
                onChange={(event) => setStartDate(new Date(event.target.value))}
              />
            </Shelf>
            <Shelf gap={2}>
              <Text>To</Text>
              <DateInput
                value={endDate.toISOString().slice(0, 10)}
                onChange={(event) => setEndDate(new Date(event.target.value))}
              />
            </Shelf>
            {report === 'pool-balance' && (
              <Shelf gap={2}>
                <Text>Group by</Text>
                <InputGroup>
                  <RadioButton
                    name="month"
                    label="Month"
                    onChange={() => setGroupBy('month')}
                    checked={groupBy === 'month'}
                  />
                  <RadioButton name="day" label="Day" onChange={() => setGroupBy('day')} checked={groupBy === 'day'} />
                </InputGroup>
              </Shelf>
            )}
            {report === 'investor-tx' && (
              <Shelf gap={2}>
                <Text>Token</Text>
                <Select
                  placeholder="Select a token"
                  options={
                    metadata?.tranches
                      ? Object.keys(metadata?.tranches).map((trancheId) => {
                          return {
                            label: `${metadata?.pool?.name} ${metadata.tranches![trancheId].name}`,
                            value: trancheId,
                          }
                        })
                      : []
                  }
                  value={activeTranche}
                  onSelect={(newTranche) => {
                    if (newTranche) {
                      setActiveTranche(newTranche as string)
                    }
                  }}
                />
              </Shelf>
            )}
          </Stack>
          <Stack as={Card} gap={2} p={2}>
            <Text variant="heading3">Export</Text>
            <Shelf gap={2}>
              <Button type="button" variant="primary" onClick={() => exportRef.current()}>
                Export to CSV
              </Button>
              <Button type="button" variant="secondary" disabled>
                Export to PDF
              </Button>
            </Shelf>
          </Stack>
        </Stack>
      }
    >
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolDetailReporting
          start={startDate}
          end={endDate}
          pool={pool}
          report={report}
          exportRef={exportRef}
          customFilters={{ groupBy, activeTranche }}
        />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

export const PoolDetailReporting: React.FC<{
  start: Date | undefined
  end: Date | undefined
  pool: Pool | undefined
  report: Report
  exportRef: React.MutableRefObject<() => void>
  customFilters: CustomFilters
}> = ({ start, end, pool, report, exportRef, customFilters }) => {
  if (!pool) return <Spinner />
  return (
    <>
      <PageSection
        title={titleByReport[report]}
        titleAddition={start && end ? `${formatDate(start.toString())} to ${formatDate(end.toString())}` : ''}
      >
        <React.Suspense fallback={<Spinner />}>
          <ReportComponent pool={pool} report={report} exportRef={exportRef} customFilters={customFilters} />
        </React.Suspense>
      </PageSection>
    </>
  )
}
