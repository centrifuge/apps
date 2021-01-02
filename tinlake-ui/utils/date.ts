export const dateToYMD = (unix: number) => {
  return new Date(unix * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const dateToYMDTechnical = (unix: number) => {
  return new Date(unix * 1000).toLocaleDateString('en-US')
}

export const dateToYMDShort = (unix: number) => {
  return new Date(unix * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const daysBetween = (unixFrom: number, unixTo: number) => {
  return Math.round((unixTo - unixFrom) / (60 * 60 * 24))
}
