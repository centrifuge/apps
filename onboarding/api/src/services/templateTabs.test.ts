import { formatTabs, templateIds } from './templateTabs'

describe('getPrefilledTabs', () => {
  test('full data for reif, rwa/aave', () => {
    const investor = {
      fullName: 'Satoshi Nakamoto',
      email: 'satoshi@nakamoto.com',
      verificationStatus: 'verified',
      details: {
        address: {
          countryCode: 'US',
          city: 'Los Angeles',
          entrance: '',
          state: 'CA',
          street: '123 Bitcoin Way',
          zip: '42069',
        },
        birthday: '1990-01-01T00:00:00.000Z',
      },
      domainInvestorDetails: {
        taxInfo: [
          {
            taxId: '123456789',
            taxCountryCode: 'US',
          },
        ],
      },
    }

    const result = formatTabs(templateIds.REIF, investor)

    const expected = {
      dateTabs: [{ locked: true, tabLabel: 'birthDate', value: '01/01/1990' }],
      textTabs: [
        { locked: true, tabLabel: 'taxID', value: '123456789' },
        { locked: true, tabLabel: 'Street & Number', value: '123 Bitcoin Way' },
        { locked: true, tabLabel: 'City & Postal Code', value: 'Los Angeles, CA, 42069' },
        {
          locked: false,
          tabLabel: 'Country',
          value: 'United States of America',
        },
      ],
    }

    expect(result).toEqual(expected)
  })

  test('full data for new silver, 1754, consol freight, fortuna fi s1, harbor trade, gig, 1754 series 3, new template', () => {
    const investor = {
      fullName: 'Satoshi Nakamoto',
      email: 'satoshi@nakamoto.com',
      verificationStatus: 'verified',
      details: {
        address: {
          countryCode: 'US',
          city: 'Los Angeles',
          entrance: '',
          state: 'CA',
          street: '123 Bitcoin Way',
          zip: '42069',
        },
        birthday: '1990-01-01T00:00:00.000Z',
      },
      domainInvestorDetails: {
        taxInfo: [
          {
            taxId: '123456789',
            taxCountryCode: 'US',
          },
        ],
      },
    }

    const result = formatTabs(templateIds.CONSOL_FREIGHT, investor)

    const expected = {
      dateTabs: [{ locked: true, tabLabel: 'birthDate', value: '01/01/1990' }],
      textTabs: [
        { locked: true, tabLabel: 'taxID', value: '123456789' },
        { locked: true, tabLabel: 'Street & Number', value: '123 Bitcoin Way' },
        { locked: true, tabLabel: 'City & Postal Code', value: 'Los Angeles, CA, 42069' },
        {
          locked: false,
          tabLabel: 'Country',
          value: 'United States of America',
        },
      ],
    }

    expect(result).toEqual(expected)
  })

  test('no tax id', () => {
    const investor = {
      fullName: 'Satoshi Nakamoto',
      email: 'satoshi@nakamoto.com',
      verificationStatus: 'verified',
      details: {
        address: {
          countryCode: 'US',
          city: 'Los Angeles',
          entrance: '',
          state: 'CA',
          street: '123 Bitcoin Way',
          zip: '42069',
        },
        birthday: '1990-01-01T00:00:00.000Z',
      },
      domainInvestorDetails: {
        taxInfo: [],
      },
    }

    const result = formatTabs(templateIds.CONSOL_FREIGHT, investor)

    const expected = {
      dateTabs: [{ locked: true, tabLabel: 'birthDate', value: '01/01/1990' }],
      textTabs: [
        { locked: false, tabLabel: 'taxID', value: '' },
        { locked: true, tabLabel: 'Street & Number', value: '123 Bitcoin Way' },
        { locked: true, tabLabel: 'City & Postal Code', value: 'Los Angeles, CA, 42069' },
        {
          locked: false,
          tabLabel: 'Country',
          value: 'United States of America',
        },
      ],
    }

    expect(result).toEqual(expected)
  })

  test('no city, state, zip', () => {
    const investor = {
      fullName: 'Satoshi Nakamoto',
      email: 'satoshi@nakamoto.com',
      verificationStatus: 'verified',
      details: {
        address: {
          countryCode: 'US',
          entrance: '',
          street: '123 Bitcoin Way',
        },
        birthday: '1990-01-01T00:00:00.000Z',
      },
      domainInvestorDetails: {
        taxInfo: [
          {
            taxId: '123456789',
            taxCountryCode: 'US',
          },
        ],
      },
    }

    const result = formatTabs(templateIds.CONSOL_FREIGHT, investor)

    const expected = {
      dateTabs: [{ locked: true, tabLabel: 'birthDate', value: '01/01/1990' }],
      textTabs: [
        { locked: true, tabLabel: 'taxID', value: '123456789' },
        { locked: true, tabLabel: 'Street & Number', value: '123 Bitcoin Way' },
        { locked: false, tabLabel: 'City & Postal Code', value: '' },
        {
          locked: false,
          tabLabel: 'Country',
          value: 'United States of America',
        },
      ],
    }

    expect(result).toEqual(expected)
  })

  test('no entrance, house number, street', () => {
    const investor = {
      fullName: 'Satoshi Nakamoto',
      email: 'satoshi@nakamoto.com',
      verificationStatus: 'verified',
      details: {
        address: {
          countryCode: 'US',
          city: 'Los Angeles',
          state: 'CA',
          zip: '42069',
        },
        birthday: '1990-01-01T00:00:00.000Z',
      },
      domainInvestorDetails: {
        taxInfo: [
          {
            taxId: '123456789',
            taxCountryCode: 'US',
          },
        ],
      },
    }

    const result = formatTabs(templateIds.CONSOL_FREIGHT, investor)

    const expected = {
      dateTabs: [{ locked: true, tabLabel: 'birthDate', value: '01/01/1990' }],
      textTabs: [
        { locked: true, tabLabel: 'taxID', value: '123456789' },
        { locked: false, tabLabel: 'Street & Number', value: '' },
        { locked: true, tabLabel: 'City & Postal Code', value: 'Los Angeles, CA, 42069' },
        {
          locked: false,
          tabLabel: 'Country',
          value: 'United States of America',
        },
      ],
    }

    expect(result).toEqual(expected)
  })

  test('no entrance, house number, street', () => {
    const investor = {
      fullName: 'Satoshi Nakamoto',
      email: 'satoshi@nakamoto.com',
      verificationStatus: 'verified',
      details: {
        address: {
          city: 'Los Angeles',
          entrance: '',
          state: 'CA',
          street: '123 Bitcoin Way',
          zip: '42069',
        },
        birthday: '1990-01-01T00:00:00.000Z',
      },
      domainInvestorDetails: {
        taxInfo: [
          {
            taxId: '123456789',
            taxCountryCode: 'US',
          },
        ],
      },
    }

    const result = formatTabs(templateIds.CONSOL_FREIGHT, investor)

    const expected = {
      dateTabs: [{ locked: true, tabLabel: 'birthDate', value: '01/01/1990' }],
      textTabs: [
        { locked: true, tabLabel: 'taxID', value: '123456789' },
        { locked: true, tabLabel: 'Street & Number', value: '123 Bitcoin Way' },
        { locked: true, tabLabel: 'City & Postal Code', value: 'Los Angeles, CA, 42069' },
        {
          locked: false,
          tabLabel: 'Country',
          value: '',
        },
      ],
    }

    expect(result).toEqual(expected)
  })
})
