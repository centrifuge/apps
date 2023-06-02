import { Stack } from '@centrifuge/fabric'
import Chart from 'chart.js/auto'
import * as React from 'react'

const POOL_CONFIG_REPORTS = {
  reports: {
    poolOverview: {
      sections: [
        {
          name: 'Exposure by US state',
          aggregate: 'sumOfNormalizedDebtPerState',
          view: 'chart',
          viewData: { type: 'bar' },
        },
      ],
    },
  },
}

const POD_INDEXER_DATA = {
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
  },
}

const PortfolioSection: React.VFC = () => {
  React.useEffect(() => {
    Chart.defaults.borderColor = '#eee'
    Chart.defaults.color = '#000'
    ;(async function () {
      const report = POOL_CONFIG_REPORTS['reports']['poolOverview']['sections'][0]
      const data = POD_INDEXER_DATA['data']['sumOfNormalizedDebtPerState']

      new Chart(document.getElementById('chart'), {
        ...report.viewData,
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
    })()
  }, [])

  return (
    <Stack>
      <div>
        <canvas id="chart"></canvas>
      </div>
    </Stack>
  )
}

export default PortfolioSection
