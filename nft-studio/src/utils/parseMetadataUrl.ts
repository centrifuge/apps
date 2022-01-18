const IFPS_GATEWAY = process.env.REACT_APP_IPFS_GATEWAY

export function parseMetadataUrl(url: string) {
  try {
    let newUrl

    if (!url.includes(':')) {
      // string without protocol is assumed to be an IPFS hash
      newUrl = new URL(`ipfs/${url}`, IFPS_GATEWAY)
    } else if (url.startsWith('ipfs://')) {
      newUrl = new URL(url.substr(7), IFPS_GATEWAY)
    } else {
      newUrl = new URL(url)
    }

    return newUrl.href
  } catch (e) {
    console.log('e', e)
    return url
  }
}
