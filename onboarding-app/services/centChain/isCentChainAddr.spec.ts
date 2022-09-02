import { isCentChainAddr } from './isCentChainAddr'

test('isCentChainAddr', () => {
  expect(isCentChainAddr('DwzJaMkVmfuAnCjYkrFS6sUeyMiv4k4KdY7AqBdri8Ruw3e')).toBe(false)
  expect(isCentChainAddr('4gbZPQj73typmpfGFVBjE5n9kutSWi3PZdvfFcvp7GQT6iLx')).toBe(true)
})
