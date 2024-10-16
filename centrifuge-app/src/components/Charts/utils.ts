type ChartDataProps = {
  [key: string]: any
}

export const getRangeNumber = (rangeValue: string, poolAge?: number) => {
  if (rangeValue === '30d') {
    return 30
  }
  if (rangeValue === '90d') {
    return 90
  }

  if (rangeValue === 'ytd') {
    const today = new Date()
    const januaryFirst = new Date(today.getFullYear(), 0, 1)
    const timeDifference = new Date(today).getTime() - new Date(januaryFirst).getTime()
    const daysSinceJanuary1 = Math.floor(timeDifference / (1000 * 60 * 60 * 24))

    return daysSinceJanuary1 + 1
  }

  if (rangeValue === 'all') {
    return poolAge
  }

  return 30
}

export const getOneDayPerMonth = (chartData: ChartDataProps[], key: string): (string | number)[] => {
  const seenMonths = new Set<string>()
  const result: (string | number)[] = []

  chartData.forEach((item) => {
    const value = item[key]
    if (value) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' })

        if (!seenMonths.has(monthYear)) {
          seenMonths.add(monthYear)
          result.push(date.getTime())
        }
      }
    }
  })

  return result
}
