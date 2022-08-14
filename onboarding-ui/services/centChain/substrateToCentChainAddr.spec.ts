import { substrateToCentChainAddr } from './substrateToCentChainAddr'

test('substrateToCentChainAddr', () => {
  expect(substrateToCentChainAddr('5DRURaoTaVAzNwuy9V9nG8CBF3fjwNxFYuojBFThXi7qkcKE')).toBe(
    '4chWsdZ3GjvdSbVBiHsdzibdN8oycHB8RGUwV9btkaYv4iMh'
  )
  expect(substrateToCentChainAddr('12MmZv4XSGSTpUvV78CnQH2L6ffPdgWPdQYDLYT45o9Mw7q3')).toBe(
    '4chWsdZ3GjvdSbVBiHsdzibdN8oycHB8RGUwV9btkaYv4iMh'
  )
  expect(substrateToCentChainAddr('Dw65u9LCrBv8bjQvBxqA5ZBPdwyk3mS1HeUZujf1WLLVku7')).toBe(
    '4chWsdZ3GjvdSbVBiHsdzibdN8oycHB8RGUwV9btkaYv4iMh'
  )
})
