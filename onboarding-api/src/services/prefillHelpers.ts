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

    const birthMonth = `${dateWithNoTimeZone.getMonth() + 1}`.padStart(2, '0')

    const birthDate = `${dateWithNoTimeZone.getDate()}`.padStart(2, '0')

    const birthYear = dateWithNoTimeZone.getFullYear()

    const birthday = `${birthMonth}/${birthDate}/${birthYear}`

    if (!isNaN(Date.parse(birthday))) {
      return birthday
    }
  }

  return ''
}
