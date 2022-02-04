export const formatEntranceHouseNumberStreet = (entrance, houseNumber, street) => {
  if (entrance && houseNumber && street) {
    return `${entrance}, ${houseNumber}, ${street}`
  }

  if (entrance && houseNumber) {
    return `${entrance}, ${houseNumber}`
  }

  if (entrance && street) {
    return `${entrance}, ${street}`
  }

  if (houseNumber && street) {
    return `${houseNumber}, ${street}`
  }

  if (entrance) {
    return entrance
  }

  if (houseNumber) {
    return houseNumber
  }

  if (street) {
    return street
  }

  return ''
}

export const formatCityStateZip = (city, state, zip) => {
  if (city && state && zip) {
    return `${city}, ${state}, ${zip}`
  }

  if (city && state) {
    return `${city}, ${state}`
  }

  if (city && zip) {
    return `${city}, ${zip}`
  }

  if (state && zip) {
    return `${state}, ${zip}`
  }

  if (city) {
    return city
  }

  if (state) {
    return state
  }

  if (zip) {
    return zip
  }

  return ''
}

export const formatBirthday = (date) => {
  if (date) {
    const dateWithNoTimeZone = new Date(date.replace('Z', ''))

    // pads month with leading 0 if single digit
    const birthMonth = `0${dateWithNoTimeZone.getMonth() + 1}`.slice(-2)

    // pads date with leading 0 if single digit
    const birthDate = `0${dateWithNoTimeZone.getDate()}`.slice(-2)

    const birthYear = dateWithNoTimeZone.getFullYear()

    return `${birthMonth}/${birthDate}/${birthYear}`
  }

  return ''
}
