import { Pool } from '@centrifuge/centrifuge-js'
import { Button, Card, DateInput, InputGroup, RadioButton, Select, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageSection } from '../../../components/PageSection'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { ReportComponent } from '../../../components/Report'
import { Spinner } from '../../../components/Spinner'
import { formatDate } from '../../../utils/date'
import { usePool } from '../../../utils/usePools'
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

  const [startDate, setStartDate] = React.useState(pool?.createdAt ? new Date(pool?.createdAt) : new Date())
  const [endDate, setEndDate] = React.useState(new Date())

  const [report, setReport] = React.useState('investor-tx' as Report)
  const [groupBy, setGroupBy] = React.useState('day' as GroupBy)

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
          groupBy={groupBy}
        />
        {/* ?.filter(
              (state) => Number(state.timestamp) >= startDate.getTime() && Number(state.timestamp) <= endDate.getTime()
            ) */}
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
  groupBy: GroupBy
}> = ({ start, end, pool, report, exportRef, groupBy }) => {
  if (!pool) return <Spinner />
  return (
    <>
      <PageSection
        title={titleByReport[report]}
        titleAddition={start && end ? `${formatDate(start.toString())} to ${formatDate(end.toString())}` : ''}
      >
        <React.Suspense fallback={<Spinner />}>
          <ReportComponent pool={pool} report={report} exportRef={exportRef} groupBy={groupBy} />
        </React.Suspense>
      </PageSection>
    </>
  )
}
