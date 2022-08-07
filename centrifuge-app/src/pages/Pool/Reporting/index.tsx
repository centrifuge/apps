import { Pool } from '@centrifuge/centrifuge-js'
import { DailyPoolState } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Button, Card, DateInput, InputGroup, RadioButton, Select, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageSection } from '../../../components/PageSection'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { Report } from '../../../components/Report'
import { Spinner } from '../../../components/Spinner'
import { formatDate } from '../../../utils/date'
import { useDailyPoolStates, usePool } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

export const PoolDetailReportingTab: React.FC = () => {
  const [startDate, setStartDate] = React.useState(new Date())
  const [endDate, setEndDate] = React.useState(new Date())

  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const poolStates = useDailyPoolStates(poolId)

  const exportRef = React.useRef(() => {
    return '0'
  })

  React.useEffect(() => {
    if (poolStates && poolStates.length > 0) {
      setStartDate(new Date(poolStates[0].timestamp + 1))
      setEndDate(new Date(poolStates[poolStates.length - 1].timestamp + 1))
    }
  }, [poolStates])

  return (
    <PageWithSideBar
      sidebar={
        <Stack gap={2}>
          <Stack as={Card} gap={2} p={2}>
            <Text variant="heading3">Switch report</Text>

            <Select
              placeholder="Select a report"
              options={[
                { label: 'Pool balance', value: 'pool-balance' },
                { label: 'Token performance', value: 'token-performance' },
                { label: 'Asset performance', value: 'asset-performance' },
              ]}
              value={'pool-balance'}
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
                <RadioButton name="month" label="Month" disabled />
                <RadioButton name="week" label="Week" disabled />
                <RadioButton name="day" label="Day" />
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
          poolStates={poolStates || []}
          exportRef={exportRef}
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
  poolStates: DailyPoolState[]
  exportRef: React.MutableRefObject<Function>
}> = ({ start, end, pool, poolStates, exportRef }) => {
  if (!pool) return null
  return (
    <>
      <PageSection
        title="Pool balance"
        titleAddition={start && end ? `${formatDate(start.toString())} to ${formatDate(end.toString())}` : ''}
      >
        <React.Suspense fallback={<Spinner />}>
          <Report pool={pool} poolStates={poolStates} exportRef={exportRef} />
        </React.Suspense>
      </PageSection>
    </>
  )
}
