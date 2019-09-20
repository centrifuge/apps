export function networkIdToName(id: string) {
  switch (id) {
    case '1': return 'mainnet';
    case '2': return 'morden';
    case '3': return 'ropsten';
    case '4': return 'rinkeby';
    case '5': return 'goerli';
    case '42': return 'kovan';
    case '100': return 'xDai';
    case '99': return 'local';
    default: return 'unknown';
  }
}

export function networkUrlToName(url: string) {
  if (url.indexOf('mainnet') > -1) return 'mainnet';
  if (url.indexOf('morden') > -1) return 'morden';
  if (url.indexOf('ropsten') > -1) return 'ropsten;';
  if (url.indexOf('rinkeby') > -1) return 'rinkeby';
  if (url.indexOf('goerli') > -1) return 'goerli';
  if (url.indexOf('kovan') > -1) return 'kovan';
  if (url.indexOf('xDai') > -1) return 'xDai';
  if (url.indexOf('localhost') > -1) return 'local';
  return 'unknown';
}
