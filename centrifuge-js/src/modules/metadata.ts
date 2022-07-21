import { from, Observable } from 'rxjs'
import Centrifuge from '..'

export function getMetadataModule(inst: Centrifuge) {
  function getMetadata<T = any>(uri: string): Observable<T | T[] | null> {
    const url = parseMetadataUrl(uri, inst.config.metadataHost)
    if (!url) {
      return from([])
    }
    return inst.getMetadataObservable<T>(url)
  }

  return { getMetadata }
}

export function parseMetadataUrl(url: string, hostname: string) {
  try {
    let newUrl

    if (!url.includes(':')) {
      // string without protocol is assumed to be an IPFS hash
      newUrl = new URL(`ipfs/${url}`, hostname)
    } else if (url.startsWith('ipfs://')) {
      newUrl = new URL(url.substr(7), hostname)
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
