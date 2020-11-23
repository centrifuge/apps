import { addThousandsSeparators } from './addThousandsSeparators'

test('addThousandsSeparators formats correctly', () => {
  expect(addThousandsSeparators('0')).toBe('0')
  expect(addThousandsSeparators('12345678901234567890')).toBe('12,345,678,901,234,567,890')
  expect(addThousandsSeparators('12345678901234567890.12345678901234567890')).toBe(
    '12,345,678,901,234,567,890.12345678901234567890'
  )
})
