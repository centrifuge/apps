import { PoolMetadata, TokenBalance } from '@centrifuge/centrifuge-js'
import { formatBalance, useCentrifuge } from '@centrifuge/centrifuge-react'
import { Shelf, Text } from '@centrifuge/fabric'
import Chart from 'chart.js/auto'
import * as React from 'react'
import { useQuery } from 'react-query'
import styled from 'styled-components'
import { usePool, usePoolMetadata } from '../../utils/usePools'

type Props = {
  page: keyof Exclude<PoolMetadata['reports'], undefined>
  poolId: string
}

export function PodIndexerReports({ page, poolId }: Props) {
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const centrifuge = useCentrifuge()
  const { data } = useQuery(
    ['podIndexerReports', page],
    async () => {
      const realData = await centrifuge.pod.getReports([metadata!.pod!.indexer![0], metadata as any, page])
      return realData
    },
    {
      enabled: !!metadata?.reports,
    }
  )

  const sectionsWithData =
    data && metadata?.reports?.[page].sections.map((s) => ({ ...s, data: (data as any)[s.aggregate] }))

  return sectionsWithData ? <ReportSections sections={sectionsWithData} /> : null
}

type ReportSectionWithData = Required<PoolMetadata>['reports']['poolOverview']['sections'][0] & { data: any }

type ChartData = Record<`key${number}` | `value${number}`, any>[]

function displayChart(reportSection: ReportSectionWithData, data: ChartData, node: HTMLCanvasElement) {
  const filtered = data.filter((d) => d.value0 != null)
  return new Chart(node, {
    ...reportSection.viewData,
    data: {
      labels: filtered.map((row) => row.value0),
      datasets: [
        {
          data: filtered.map((row) => new TokenBalance(row.value1, reportSection.viewData.decimals || 0).toFloat()),
          backgroundColor: '#2762ff',
        },
      ],
    },

    options: {
      ...reportSection.viewData.options,
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  })
}

const Section = styled(Shelf)`
  height: 300px;
`

const SectionContent = styled.div`
  text-align: center;
`

function ReportSections({ sections }: { sections: ReportSectionWithData[] }) {
  return (
    <Section gap="50px" alignItems="flex-start">
      {sections.map((section) =>
        section.view === 'chart' ? <ChartSection section={section} /> : <CounterSection section={section} />
      )}
    </Section>
  )
}

Chart.defaults.borderColor = '#eee'
Chart.defaults.color = 'rgb(97, 97, 97)'

function ChartSection({ section }: { section: ReportSectionWithData }) {
  const ref = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const chart = displayChart(section, section.data, ref.current!)
    return () => {
      chart.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ width: '50%' }}>
      <Text variant="heading5" style={{ marginBottom: '24px' }}>
        {section.name}
      </Text>
      <SectionContent>
        <canvas ref={ref} />
      </SectionContent>
    </div>
  )
}

function CounterSection({ section }: { section: ReportSectionWithData }) {
  return (
    <div style={{ width: '50%' }}>
      <Text variant="heading5" style={{ marginBottom: '24px' }}>
        {section.name}
      </Text>
      <SectionContent>
        <Text variant="heading1" style={{ marginBottom: '24px', fontSize: '60px' }}>
          {formatBalance(
            new TokenBalance(section.data[0].value0, section.viewData.decimals || 0),
            section.viewData.symbol
          )}
        </Text>
        <Text variant="heading6" style={{ marginBottom: '24px' }}>
          {section.viewData.label}
        </Text>
      </SectionContent>
    </div>
  )
}
