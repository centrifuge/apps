export function getRandomUint() {
  return (Math.random() * (2 ** 53 - 1)) >>> 0
}
