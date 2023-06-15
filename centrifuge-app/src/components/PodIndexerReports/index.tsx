import { PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Shelf, Text } from '@centrifuge/fabric'
import Chart from 'chart.js/auto'
import * as React from 'react'
import { useQuery } from 'react-query'
import { usePool, usePoolMetadata } from '../../utils/usePools'

type Props = {
  page: keyof Exclude<PoolMetadata['reports'], undefined>
  poolId: string
}

// const POOL_CONFIG_REPORTS: { reports: { [name: string]: { sections: ReportSection[] } } } = {
//   reports: {
//     poolOverview: {
//       sections: [
//         {
//           name: 'Exposure by US state',
//           aggregate: 'sumOfNormalizedDebtPerState',
//           view: 'chart',
//           viewData: { type: 'bar' },
//         },
//         {
//           name: 'Average FICO score (weighted by outstanding debt) over time',
//           aggregate: 'ficoScoreWeightedByNormalizedDebtOverTime',
//           view: 'chart',
//           viewData: {
//             type: 'line',
//             options: {
//               plugins: {
//                 legend: {
//                   labels: {
//                     font: {
//                       family: 'Inter',
//                       size: 20,
//                     },
//                   },
//                 },
//               },
//               scales: {
//                 y: [
//                   {
//                     min: 500,
//                     max: 700,
//                   },
//                 ],
//               },
//             },
//           },
//         },
//       ],
//     },
//   },
// }

const MOCK_DATA = {
  sumOfNormalizedDebtPerState: [
    {
      key1: 'CA',
      value1: 200314,
    },
    {
      key1: 'TX',
      value1: 120123,
    },
    {
      key1: 'NY',
      value1: 581202,
    },
  ],
  ficoWeightedByNormalizedDebt: [
    {
      key1: '2023-05-20',
      value1: 608,
    },
    {
      key1: '2023-05-21',
      value1: 605,
    },
    {
      key1: '2023-05-22',
      value1: 610,
    },
    {
      key1: '2023-05-23',
      value1: 610,
    },
    {
      key1: '2023-05-24',
      value1: 610,
    },
    {
      key1: '2023-05-25',
      value1: 605,
    },
    {
      key1: '2023-05-26',
      value1: 601,
    },
  ],
}

export function PodIndexerReports({ page, poolId }: Props) {
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const centrifuge = useCentrifuge()
  const { data } = useQuery(
    ['podIndexerReports', page],
    () => {
      const realData = centrifuge.pod.getReports([metadata!.pod!.indexer!, metadata as any, page])
      console.log('realData', realData)
      return MOCK_DATA
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

type ChartData = { key1: any; value1: any }[]

function displayChart(reportSection: ReportSectionWithData, data: ChartData, node: HTMLCanvasElement) {
  return new Chart(node, {
    ...reportSection.viewData,
    data: {
      labels: data.map((row) => row.key1),
      datasets: [
        {
          data: data.map((row) => row.value1),
          backgroundColor: '#2762ff',
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  })
}

function ReportSections({ sections }: { sections: ReportSectionWithData[] }) {
  return (
    <Shelf gap="50px">
      {sections.map((section) => (
        <ReportSection section={section} />
      ))}
    </Shelf>
  )
}

Chart.defaults.borderColor = '#eee'
Chart.defaults.color = 'rgb(97, 97, 97)'

function ReportSection({ section }: { section: ReportSectionWithData }) {
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
      <canvas ref={ref} />
    </div>
  )
}
