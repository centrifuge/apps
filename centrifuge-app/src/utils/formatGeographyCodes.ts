export const formatGeographyCodes = (geographyCodes: { [key: string]: string }) =>
  Object.keys(geographyCodes).map((key) => ({
    label: geographyCodes[key],
    value: key,
  }))
