import { accountIdToCentChainAddr } from './accountIdToCentChainAddr'

test('accountIdToCentChainAddr', () => {
  expect(accountIdToCentChainAddr('0xe87917694365962c12cad1beaf3993fda26ba37d6b9cd251185b55e3daec8b72')).toBe(
    '4gbZPQj73typmpfGFVBjE5n9kutSWi3PZdvfFcvp7GQT6iLx'
  )
})
