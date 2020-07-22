export function networkIdToName(id: number) {
  switch (id) {
    case 1:
      return 'Mainnet'
    case 2:
      return 'Morden'
    case 3:
      return 'Ropsten'
    case 4:
      return 'Rinkeby'
    case 5:
      return 'Goerli'
    case 42:
      return 'Kovan'
    case 100:
      return 'XDai'
    case 99:
      return 'Local'
  }
  return null
}

export function networkNameToId(name: string) {
  switch (name) {
    case 'Mainnet':
      return 1
    case 'Morden':
      return 2
    case 'Ropsten':
      return 3
    case 'Rinkeby':
      return 4
    case 'Goerli':
      return 5
    case 'Kovan':
      return 42
    case 'XDai':
      return 100
    case 'Local':
      return 99
    default:
      return null
  }
}

export function networkUrlToName(url: string) {
  if (url.indexOf('mainnet') > -1) return 'Mainnet'
  if (url.indexOf('morden') > -1) return 'Morden'
  if (url.indexOf('ropsten') > -1) return 'Ropsten;'
  if (url.indexOf('rinkeby') > -1) return 'Rinkeby'
  if (url.indexOf('goerli') > -1) return 'Goerli'
  if (url.indexOf('kovan') > -1) return 'Kovan'
  if (url.indexOf('xDai') > -1) return 'XDai'
  if (url.indexOf('localhost') > -1) return 'Local'
  return null
}
