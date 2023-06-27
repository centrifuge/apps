export function getRewardsDurationInDays(blocks: number) {
  const executionTimePerBlockInSeconds = 12
  const blocksPerDay = (24 * 60 * 60) / executionTimePerBlockInSeconds
  return Math.round(blocks / blocksPerDay)
}
