import { formatAddress } from './formatAddress'

test('formats correctly', () => {
  expect(formatAddress('0x0a735602a357802f553113f5831fe2fbf2f0e2e0')).toBe('0x0a73...e2e0')
  expect(formatAddress('0xabcdef')).toBe('0xabcd...cdef')
  expect(formatAddress('0xab')).toBe('0xab...0xab')
  expect(formatAddress('')).toBe('')
})
