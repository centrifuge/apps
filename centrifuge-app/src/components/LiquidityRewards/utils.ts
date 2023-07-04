export function getRewardsDurationInDays(milliseconds: number): number {
  const days = milliseconds / (1000 * 60 * 60 * 24)
  return Math.round(days)
}
