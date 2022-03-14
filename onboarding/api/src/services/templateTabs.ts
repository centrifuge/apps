import { getName } from 'i18n-iso-countries'
import { formatBirthday, formatCityStateZip, formatEntranceHouseNumberStreet } from './prefillHelpers'

export const templateIds = {
  '1754_SERIES_3': '892cad87-9734-4e16-bcac-f70dbe91356a',
  'RWA/AAVE': 'a4f7d075-89ec-49c5-9165-d5b136cf2416',
  1754: 'bc240308-7286-49f4-b1eb-6434a771bc53',
  CONSOL_FREIGHT: 'a9adc13b-a990-4d58-b54f-647762853923',
  FORTUNA_FI_S1: '3b3a33b8-23fc-40a4-8a4c-d1f5edd52f96',
  GIG: '4742c326-3ca2-4e5f-9aea-0b3946eddf2e',
  HARBOR_TRADE: 'fb9d4f62-43b3-4e8f-b135-4d29a4a72a0e',
  NEW_SILVER: '19750b36-24ab-43e3-9441-23abc2f09a80',
  NEW_TEMPLATE: '--', // tbd
  REIF: '78c4e681-500d-46cf-bafc-4e7d79dc8409',
}

export const formatTabs = (templateId, investor) => {
  const { details, domainInvestorDetails, email, fullName, verificationStatus } = investor
  const { address, birthday } = details
  const { city, countryCode, entrance, houseNumber, state, street, zip } = address

  const birthDate = formatBirthday(birthday)
  const entranceHouseNumberStreet = formatEntranceHouseNumberStreet(entrance, houseNumber, street)
  const cityStateZip = formatCityStateZip(city, state, zip)
  const taxId = domainInvestorDetails?.taxInfo[0]?.taxId

  const countryName = getName(countryCode, 'en')

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
        {
          value: countryName || '',
          tabLabel: 'Country',
          locked: false,
        },
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
