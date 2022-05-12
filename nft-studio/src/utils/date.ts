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

export const formatAge = (ageInDays: number) => {
  if (ageInDays > 0 && ageInDays > 90) {
    return `${Math.round(((ageInDays || 0) / (365 / 12)) * 10) / 10} months`
  } else if (ageInDays > 365) {
    return `${Math.round(((ageInDays || 0) / 365) * 10) / 10} years`
  }
  return `${Math.round((ageInDays || 0) * 10) / 10} days`
}

export const getAge = (createdAt: string | undefined | null) => {
  if (createdAt) {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    return formatAge(daysBetween(createdAt, today))
  }
  return '0 days'
}
