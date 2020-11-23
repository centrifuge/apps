export const secondsToHms = (d: number) => {
  const h = Math.floor(d / 3600)
  const m = Math.floor((d % 3600) / 60)

  const hDisplay = h > 0 ? h + (h === 1 ? ' hr' : ' hrs') : ''
  const mDisplay = m > 0 ? m + (m === 1 ? ' min' : ' mins') : h > 0 ? '' : '0 min'
  return hDisplay + (hDisplay.length > 0 && mDisplay.length > 0 ? ', ' : '') + mDisplay
}
