import { Shelf, Text } from '@centrifuge/fabric'
import Chart from 'chart.js/auto'
import * as React from 'react'

const POOL_CONFIG_REPORTS: { reports: { [name: string]: { sections: ReportSection[] } } } = {
  reports: {
    poolOverview: {
      sections: [
        {
          name: 'Exposure by US state',
          aggregate: 'sumOfNormalizedDebtPerState',
          view: 'chart',
          viewData: { type: 'bar' },
        },
        {
          name: 'Average FICO score (weighted by outstanding debt) over time',
          aggregate: 'ficoScoreWeightedByNormalizedDebtOverTime',
          view: 'chart',
          viewData: {
            type: 'line',
            options: {
              plugins: {
                legend: {
                  labels: {
                    font: {
                      family: 'Inter',
                      size: 20,
                    },
                  },
                },
              },
              scales: {
                y: [
                  {
                    min: 500,
                    max: 700,
                  },
                ],
              },
            },
          },
        },
      ],
    },
  },
}

const POD_INDEXER_DATA: { data: { [id: string]: ChartData } } = {
  data: {
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
    ficoScoreWeightedByNormalizedDebtOverTime: [
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
  },
}

interface ReportSection {
  name: string
  aggregate: string
  view: 'chart' | 'counter'
  viewData: any // TODO
}

type ChartData = { key1: any; value1: any }[]

const displayChart = async (reportSection: ReportSection, data: ChartData) => {
  new Chart(document.getElementById(`chart_${reportSection.aggregate}`), {
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

const PortfolioSection: React.VFC = () => {
  React.useEffect(() => {
    Chart.defaults.borderColor = '#eee'
    Chart.defaults.color = 'rgb(97, 97, 97)'
    ;(async function () {
      POOL_CONFIG_REPORTS['reports']['poolOverview']['sections'].forEach((reportSection) => {
        displayChart(reportSection, POD_INDEXER_DATA['data'][reportSection.aggregate])
      })
    })()
  }, [])

  return (
    <Shelf gap="50px">
      {POOL_CONFIG_REPORTS['reports']['poolOverview']['sections'].map((reportSection) => (
        <div style={{ width: '50%' }}>
          <Text variant="heading5" style={{ marginBottom: '24px' }}>
            {reportSection.name}
          </Text>
          <canvas id={`chart_${reportSection.aggregate}`}></canvas>
        </div>
      ))}
    </Shelf>
  )
}

export default PortfolioSection
