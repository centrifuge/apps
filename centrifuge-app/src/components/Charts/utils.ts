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

    return daysSinceJanuary1
  }

  if (rangeValue === 'all' && poolAge) {
    return poolAge
  }

  return 30
}
