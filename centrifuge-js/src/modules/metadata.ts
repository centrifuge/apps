import { from, Observable } from 'rxjs'
import Centrifuge from '..'

export function getMetadataModule(inst: Centrifuge) {
  function getMetadata<T = any>(uri: string): Observable<T | T[] | null> {
    const url = parseMetadataUrl(uri)
    if (!url) {
      return from([])
    }
    return inst.getMetadataObservable<T>(url)
  }

  function pinNFTMetadata(metadata: any): Observable<string> {
    if (!inst.config.pinNFTMetadata) {
      console.error('pinNFTMetadata must be set in config to use this feature')
      return from([])
    }
    return from(
      inst.config.pinNFTMetadata({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(metadata),
      })
    )
  }

  function pinPoolMetadata(metadata: any): Observable<string> {
    if (!inst.config.pinPoolMetadata) {
      console.error('pinPoolMetadata must be set in config to use this feature')
      return from([])
    }
    return from(
      inst.config.pinPoolMetadata({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(metadata),
      })
    )
  }

  function parseMetadataUrl(url: string) {
    try {
      let newUrl

      if (!url.includes(':')) {
        // string without protocol is assumed to be an IPFS hash
        newUrl = new URL(`ipfs/${url}`, inst.config.metadataHost)
      } else if (url.startsWith('ipfs://')) {
        newUrl = new URL(url.substr(7), inst.config.metadataHost)
      } else {
        newUrl = new URL(url)
      }

      if (newUrl.protocol === 'http:' || newUrl.protocol === 'https:') {
        return newUrl.href
      }

      return ''
    } catch (e) {
      return ''
    }
  }

  return { getMetadata, parseMetadataUrl, pinNFTMetadata, pinPoolMetadata }
}
