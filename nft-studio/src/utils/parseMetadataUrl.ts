const IFPS_GATEWAY = process.env.REACT_APP_IPFS_GATEWAY

export function parseMetadataUrl(url: string) {
  let newUrl = new URL(url)
  if (url.startsWith('ipfs://')) {
    newUrl = new URL(url.substr(7), IFPS_GATEWAY)
  }

  return newUrl.href
}
