import { first, from, map, Observable } from 'rxjs'
import Centrifuge from '..'

export function getMetadataModule(inst: Centrifuge) {
  function getMetadata<T = any>(uri: string): Observable<T | T[] | null> {
    const url = parseMetadataUrl(uri)
    if (!url) {
      return from([])
    }
    return inst.getMetadataObservable<T>(url)
  }

  function pinFile(b64URI?: string, request?: RequestInit): Observable<{ uri: string; ipfsHash: string }> {
    if (!inst.config?.pinFile) {
      console.error('pinFile must be set in config to use this feature')
      return from([])
    }
    if (!b64URI) {
      return from([])
    }

    return from(inst.config.pinFile(b64URI, request ?? {}))
      .pipe(first())
      .pipe(map(({ uri }) => parseIPFSHash(uri)))
  }

  function pinJson(metadata: Record<any, any>, request?: RequestInit): Observable<{ uri: string; ipfsHash: string }> {
    const file = jsonToBase64(metadata)
    return pinFile(file, request)
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

  const IPFS_HASH_LENGTH = 46
  function parseIPFSHash(uri: string) {
    if (uri.includes('ipfs://')) {
      const hash = uri
        .split(/ipfs:\/\/ipfs\//)
        .filter(Boolean)
        .join()
      return { uri, ipfsHash: hash }
    } else if (!uri.includes('/') && uri.length === IPFS_HASH_LENGTH) {
      return { uri: `ipfs://ipfs/${uri}`, ipfsHash: uri }
    }
    return { uri, ipfsHash: '' }
  }

  return { getMetadata, parseMetadataUrl, pinFile, pinJson }
}

function jsonToBase64(jsonInput: Record<any, any>) {
  try {
    const json = JSON.stringify(jsonInput)
    return btoa(json)
  } catch (error) {
    throw new Error('Invalid JSON')
  }
}
