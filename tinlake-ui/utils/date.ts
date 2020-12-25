export const dateToYMD = (unix: number) => {
  return new Date(unix * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const dateToYMDShort = (unix: number) => {
  return new Date(unix * 1000).toLocaleDateString('en-US', {
    // year: '2-digit',
    month: 'short',
    // day: 'numeric',
  })
}
