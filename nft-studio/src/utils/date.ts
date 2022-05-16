export const formatDate = (timestampSeconds: number) => {
  return new Date(timestampSeconds * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatDateTechnical = (timestampSeconds: number) => {
  return new Date(timestampSeconds).toLocaleDateString('en-US')
}

export const daysBetween = (unixFrom: number, unixTo: number) => {
  return Math.floor((unixTo - unixFrom) / (60 * 60 * 24))
}
