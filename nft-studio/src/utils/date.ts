export function formatDate(timestamp: number | string) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTechnical(timestamp: number | string) {
  return new Date(timestamp).toLocaleDateString('en-US')
}

export function daysBetween(from: number | string | Date, to: number | string | Date) {
  const fromMs = new Date(from).getTime()
  const toMs = new Date(to).getTime()
  return Math.floor((toMs - fromMs) / (60 * 60 * 24 * 1000))
}
