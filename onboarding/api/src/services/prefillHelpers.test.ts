import { formatBirthday, formatCityStateZip, formatEntranceHouseNumberStreet } from './prefillHelpers'

describe('formatBirthday', () => {
  test('should return birthday in MM/DD/YYYY for dates with leading zeros ', () => {
    const date = '2000-03-02T00:00:00.000Z'

    const result = formatBirthday(date)

    expect(result).toBe('03/02/2000')
  })

  test('should return birthday in MM/DD/YYYY format', () => {
    const date = '2000-12-25T00:00:00.000Z'

    const result = formatBirthday(date)

    expect(result).toBe('12/25/2000')
  })

  test('should return ""', () => {
    const date = ''

    const result = formatBirthday(date)

    expect(result).toBe('')
  })
})

describe('formatCityStateZip', () => {
  test('should return city, state, zip', () => {
    const city = 'Austin'
    const state = 'TX'
    const zip = '78745'

    const result = formatCityStateZip(city, state, zip)

    expect(result).toBe('Austin, TX, 78745')
  })

  test('should return city, state', () => {
    const city = 'Austin'
    const state = 'TX'
    const zip = ''

    const result = formatCityStateZip(city, state, zip)

    expect(result).toBe('Austin, TX')
  })

  test('should return state, zip', () => {
    const city = ''
    const state = 'TX'
    const zip = '78745'

    const result = formatCityStateZip(city, state, zip)

    expect(result).toBe('TX, 78745')
  })

  test('should return city, zip', () => {
    const city = 'Austin'
    const state = ''
    const zip = '78745'

    const result = formatCityStateZip(city, state, zip)

    expect(result).toBe('Austin, 78745')
  })

  test('should return city', () => {
    const city = 'Austin'
    const state = ''
    const zip = ''

    const result = formatCityStateZip(city, state, zip)

    expect(result).toBe('Austin')
  })

  test('should return state', () => {
    const city = ''
    const state = 'TX'
    const zip = ''

    const result = formatCityStateZip(city, state, zip)

    expect(result).toBe('TX')
  })

  test('should return zip', () => {
    const city = ''
    const state = ''
    const zip = '78745'

    const result = formatCityStateZip(city, state, zip)

    expect(result).toBe('78745')
  })

  test('should return ""', () => {
    const city = ''
    const state = ''
    const zip = ''

    const result = formatCityStateZip(city, state, zip)

    expect(result).toBe('')
  })
})

describe('formatEntranceHouseNumberStreet', () => {
  test('should return entrance, houseNumber, street', () => {
    const entrance = 'North Building'
    const houseNumber = '12'
    const street = '123 Way'

    const result = formatEntranceHouseNumberStreet(entrance, houseNumber, street)

    expect(result).toBe('North Building, 12, 123 Way')
  })

  test('should return entrance, houseNumber', () => {
    const entrance = 'North Building'
    const houseNumber = '12'
    const street = ''

    const result = formatEntranceHouseNumberStreet(entrance, houseNumber, street)

    expect(result).toBe('North Building, 12')
  })

  test('should return houseNumber, street', () => {
    const entrance = ''
    const houseNumber = '12'
    const street = '123 Way'

    const result = formatEntranceHouseNumberStreet(entrance, houseNumber, street)

    expect(result).toBe('12, 123 Way')
  })

  test('should return entrance, street', () => {
    const entrance = 'North Building'
    const houseNumber = ''
    const street = '123 Way'

    const result = formatEntranceHouseNumberStreet(entrance, houseNumber, street)

    expect(result).toBe('North Building, 123 Way')
  })

  test('should return entrance', () => {
    const entrance = 'North Building'
    const houseNumber = ''
    const street = ''

    const result = formatEntranceHouseNumberStreet(entrance, houseNumber, street)

    expect(result).toBe('North Building')
  })

  test('should return houseNumber', () => {
    const entrance = ''
    const houseNumber = '12'
    const street = ''

    const result = formatEntranceHouseNumberStreet(entrance, houseNumber, street)

    expect(result).toBe('12')
  })

  test('should return street', () => {
    const entrance = ''
    const houseNumber = ''
    const street = '123 Way'

    const result = formatEntranceHouseNumberStreet(entrance, houseNumber, street)

    expect(result).toBe('123 Way')
  })

  test('should return ""', () => {
    const entrance = ''
    const houseNumber = ''
    const street = ''

    const result = formatEntranceHouseNumberStreet(entrance, houseNumber, street)

    expect(result).toBe('')
  })
})
