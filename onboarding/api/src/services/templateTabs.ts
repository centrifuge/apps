import countries from 'i18n-iso-countries'
import { formatBirthday, formatCityStateZip, formatEntranceHouseNumberStreet } from './prefillHelpers'

export const templateIds = {
  '1754_SERIES_3': '2e1d5a1a-3527-4094-9177-8fda0d6f4cc0',
  'RWA/AAVE': 'a7b4b697-a78d-4654-bd59-481d51b8fa80',
  1754: '93b69222-4ca9-48ca-9b01-e04006460d01',
  CONSOL_FREIGHT: 'efcbf8e0-aabf-44c3-92fe-583bf024a439',
  FORTUNA_FI_S1: 'ce589bb8-76d1-4e48-a4f6-bc7dac1d782b',
  GIG: 'e460985a-7f2d-40b3-ba12-466f70cd977e',
  HARBOR_TRADE: '1b56bc30-b3a6-4614-8611-04ec862f702d',
  NEW_SILVER: 'a3b0758d-23ff-4adf-ac31-bf8b516853a2',
  NEW_TEMPLATE: '--',
  REIF: '98cc99ff-8154-4e4c-a500-ba813e8d2a87',
}

export const getPrefilledTabs = (templateId, investor) => {
  const { details, domainInvestorDetails, email, fullName, verificationStatus } = investor
  const { address, birthday } = details
  const { city, countryCode, entrance, houseNumber, state, street, zip } = address

  const birthDate = formatBirthday(birthday)
  const entranceHouseNumberStreet = formatEntranceHouseNumberStreet(entrance, houseNumber, street)
  const cityStateZip = formatCityStateZip(city, state, zip)
  const taxId = domainInvestorDetails?.taxInfo[0]?.taxId

  const countryName = countries.getName(countryCode, 'en')

  const includeCountryName =
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
    if (templateId === templateIds['RWA/AAVE']) {
      return {
        textTabs: [
          {
            value: fullName,
            tabLabel: 'Text 8579f241-470b-4620-b063-09e9f787043d',
            locked: !!fullName,
          },
          {
            value: taxId,
            tabLabel: 'Text df675051-83d4-426d-beaf-b7a1650bbaf0',
            locked: !!taxId,
          },
          {
            value: birthDate,
            tabLabel: 'Text e09438aa-67ea-4f65-a451-dca31d3a54b0',
            locked: !!birthDate,
          },
          {
            value: entranceHouseNumberStreet,
            tabLabel: 'Text 7984779d-2a4c-412b-ac96-a4c467047971',
            locked: !!entranceHouseNumberStreet,
          },
          {
            value: cityStateZip,
            tabLabel: 'Text 664d43d5-c995-4823-8f45-a51a73e3f823',
            locked: !!cityStateZip,
          },
          {
            value: email,
            tabLabel: 'Text ce3e75e9-7d2f-4379-8835-7513a7bf13ef',
            locked: !!email,
          },
        ],
      }
    }

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
        ...(includeCountryName
          ? [
              {
                value: countryName || '',
                tabLabel: 'Country',
                locked: !!countryName,
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
