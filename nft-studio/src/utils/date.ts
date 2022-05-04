export const formatDate = (timestamp: number | string) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatDateTechnical = (timestamp: number | string) => {
  return new Date(timestamp).toLocaleDateString('en-US')
}

export const daysBetween = (unixFrom: number, unixTo: number) => {
  return Math.floor((unixTo - unixFrom) / (60 * 60 * 24))
}

export const formatAge = (ageInDays: number) => {
  return ageInDays > 90
    ? `${Math.round(((ageInDays || 0) / (365 / 12)) * 10) / 10} months`
    : `${Math.round((ageInDays || 0) * 10) / 10} days`
}

export const getAge = (createdAt: string | undefined | null) => {
  if (createdAt) {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    return formatAge(daysBetween(new Date(createdAt).getTime() / 1000, today.getTime() / 1000))
  }
  return '0 days'
}
