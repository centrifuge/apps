import { formatGeographyCodes } from './formatGeographyCodes'

describe('formatGeographyCodes', () => {
  it('should format geography codes', () => {
    expect(
      formatGeographyCodes({
        al: 'Albania',
        aw: 'Aruba',
      })
    ).to.equal([
      {
        label: 'Albania',
        value: 'al',
      },
      {
        label: 'Aruba',
        value: 'aw',
      },
    ])
  })
})
