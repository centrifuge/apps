export const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatDateTechnical = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-US')
}

export const daysBetween = (unixFrom: number, unixTo: number) => {
  return Math.floor((unixTo - unixFrom) / (60 * 60 * 24))
}
