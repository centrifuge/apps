import { formatBirthday, formatCityStateZip, formatEntranceHouseNumberStreet } from './prefillHelpers'

export const templateIds = {
  REIF: '98cc99ff-8154-4e4c-a500-ba813e8d2a87',
  'RWA/AAVE': 'a4f7d075-89ec-49c5-9165-d5b136cf2416',
  NEW_SILVER: '19750b36-24ab-43e3-9441-23abc2f09a80',
  1754: 'bc240308-7286-49f4-b1eb-6434a771bc53',
  CONSOL_FREIGHT: 'a9adc13b-a990-4d58-b54f-647762853923',
  FORTUNA_FI_S1: '3b3a33b8-23fc-40a4-8a4c-d1f5edd52f96',
  HARBOR_TRADE: 'fb9d4f62-43b3-4e8f-b135-4d29a4a72a0e',
  GIG: '4742c326-3ca2-4e5f-9aea-0b3946eddf2e',
  '1754_SERIES_3': '892cad87-9734-4e16-bcac-f70dbe91356a',
  NEW_TEMPLATE: '--',
}

export const getPrefilledTabs = (templateId, investor) => {
  const { details, domainInvestorDetails, verificationStatus } = investor

  const { address, birthday } = details
  const { city, countryCode, entrance, houseNumber, state, street, zip } = address

  const birthDate = formatBirthday(birthday)

  const entranceHouseNumberStreet = `${formatEntranceHouseNumberStreet(entrance, houseNumber, street)}`

  const cityStateZip = `${formatCityStateZip(city, state, zip)}`

  const taxId = domainInvestorDetails?.taxInfo[0]?.taxId

  const includeCountryCode =
    templateId === templateIds.NEW_SILVER ||
    templateId === templateIds[1754] ||
    templateId === templateIds.CONSOL_FREIGHT ||
    templateId === templateIds.FORTUNA_FI_S1 ||
    templateId === templateIds.HARBOR_TRADE ||
    templateId === templateIds.GIG ||
    templateId === templateIds['1754_SERIES_3'] ||
    templateId === templateIds.NEW_TEMPLATE

  const shouldPrefill = Object.values(templateIds).includes(templateId) && verificationStatus === 'verified'

  if (shouldPrefill) {
    return {
      textTabs: [
        {
          value: taxId || '',
          tabLabel: 'taxID',
          locked: !!taxId,
        },
        {
          value: entranceHouseNumberStreet,
          tabLabel: 'Street & Number',
          locked: !!entranceHouseNumberStreet,
        },
        {
          value: cityStateZip,
          tabLabel: 'City & Postal Code',
          locked: !!cityStateZip,
        },
        ...(includeCountryCode
          ? [
              {
                value: countryCode || '',
                tabLabel: 'Country',
                locked: !!countryCode,
              },
            ]
          : []),
      ],
      dateTabs: [
        {
          value: birthDate,
          tabLabel: 'birthDate',
          locked: !!birthDate,
        },
      ],
    }
  }
}
