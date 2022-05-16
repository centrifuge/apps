import { DetailedPool } from '@centrifuge/centrifuge-js'

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
  if (ageInDays > 90) {
    return `${Math.round(((ageInDays || 0) / (365 / 12)) * 10) / 10} months`
  } else if (ageInDays > 365) {
    return `${Math.round(((ageInDays || 0) / 365) * 10) / 10} years`
  } else if (ageInDays < 0) {
    return '0 days'
  }
  return `${Math.round((ageInDays || 0) * 10) / 10} days`
}

export const getAge = (createdAt: string | undefined | null) => {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  return formatAge(daysBetween(createdAt || today, today))
}

export function getEpochHoursRemaining(pool: DetailedPool) {
  const last = new Date(pool.epoch.lastClosed).getTime()
  const min = pool.parameters.minEpochTime * 1000
  const now = Date.now()
  return Math.ceil(Math.max(0, last + min - now) / (1000 * 60 * 60))
}
