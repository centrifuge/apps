import { first, from, Observable } from 'rxjs'
import Centrifuge from '..'

export function getMetadataModule(inst: Centrifuge) {
  function getMetadata<T = any>(uri: string): Observable<T | T[] | null> {
    const url = parseMetadataUrl(uri)
    if (!url) {
      return from([])
    }
    return inst.getMetadataObservable<T>(url)
  }

  function pinFile(metadata: Record<any, any>): Observable<{ uri: string; ipfsHash: string }> {
    if (!inst.config?.pinFile) {
      console.error('pinFile must be set in config to use this feature')
      return from([])
    }
    return from(
      inst.config.pinFile({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(metadata),
      })
    ).pipe(first())
  }

  function pinJson(metadata: Record<any, any>): Observable<{ uri: string; ipfsHash: string }> {
    if (!inst.config.pinJson) {
      console.error('pinJson must be set in config to use this feature')
      return from([])
    }
    return from(
      inst.config.pinJson({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(metadata),
      })
    ).pipe(first())
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

  return { getMetadata, parseMetadataUrl, pinFile, pinJson }
}
