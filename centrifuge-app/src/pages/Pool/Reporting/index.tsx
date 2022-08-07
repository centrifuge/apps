import { Button, Card, DateInput, InputGroup, RadioButton, Select, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageSection } from '../../../components/PageSection'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { Report, ReportingMoment } from '../../../components/Report'
import { Spinner } from '../../../components/Spinner'
import { usePool } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

export const PoolDetailReportingTab: React.FC = () => {
  return (
    <PageWithSideBar
      sidebar={
        <Stack gap={2}>
          <Stack as={Card} gap={2} p={2}>
            <Text variant="heading3">Switch report</Text>

            <Select
              placeholder="Select a report"
              options={[
                { label: 'Overview', value: 'overview' },
                { label: 'Token performance', value: 'token-performance' },
                { label: 'In- and outflows', value: 'in-outflows' },
                { label: 'Asset characteristics', value: 'asset-characteristics' },
                { label: 'Asset performance', value: 'asset-performance' },
              ]}
              value={'overview'}
            />
          </Stack>
          <Stack as={Card} gap={2} p={2}>
            <Text variant="heading3">Filter</Text>
            <Shelf gap={2}>
              <Text>Start</Text>
              <DateInput />
            </Shelf>
            <Shelf gap={2}>
              <Text>End</Text>
              <DateInput />
            </Shelf>
            <Shelf gap={2}>
              <Text>Group by</Text>
              <InputGroup>
                <RadioButton name="month" label="Month" />
                <RadioButton name="week" label="Week" />
                <RadioButton name="day" label="Day" checked />
              </InputGroup>
            </Shelf>
          </Stack>
          <Stack as={Card} gap={2} p={2}>
            <Text variant="heading3">Export</Text>
            <Shelf gap={2}>
              <Button type="button" variant="primary">
                Export to Excel
              </Button>
              <Button type="button" variant="secondary">
                Export to PDF
              </Button>
            </Shelf>
          </Stack>
        </Stack>
      }
    >
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolDetailReporting />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

export const PoolDetailReporting: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)

  const moments: ReportingMoment[] = [
    {
      blockNumber: 1000,
      timestamp: new Date(new Date().setHours(new Date().getHours() - 120)),
    },
    {
      blockNumber: 3000,
      timestamp: new Date(new Date().setHours(new Date().getHours() - 96)),
    },
    {
      blockNumber: 5000,
      timestamp: new Date(new Date().setHours(new Date().getHours() - 72)),
    },
    {
      blockNumber: 7000,
      timestamp: new Date(new Date().setHours(new Date().getHours() - 48)),
    },
    {
      blockNumber: 9000,
      timestamp: new Date(new Date().setHours(new Date().getHours() - 24)),
    },
    {
      blockNumber: 11000,
      timestamp: new Date(),
    },
  ]

  if (!pool) return null
  return (
    <>
      <PageSection
        title={`${moments[0].timestamp.toLocaleDateString('en-US', {
          month: 'short',
        })} ${moments[0].timestamp.toLocaleDateString('en-US', { day: 'numeric' })} to ${moments[
          moments.length - 1
        ].timestamp.toLocaleDateString('en-US', {
          month: 'short',
        })} ${moments[moments.length - 1].timestamp.toLocaleDateString('en-US', { day: 'numeric' })}`}
      >
        <React.Suspense fallback={<Spinner />}>
          <Report moments={moments} />
        </React.Suspense>
      </PageSection>
    </>
  )
}
