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

  function pinFile(b64URI?: string): Observable<{ uri: string; ipfsHash: string }> {
    if (!inst.config?.pinFile) {
      console.error('pinFile must be set in config to use this feature')
      return from([])
    }
    if (!b64URI) {
      return from([])
    }

    return from(inst.config.pinFile(b64URI))
      .pipe(first())
      .pipe(map(({ uri }) => parseIPFSHash(uri)))
  }

  function pinJson(metadata: Record<any, any>): Observable<{ uri: string; ipfsHash: string }> {
    if (!inst.config?.pinJson) {
      console.error('pinJson must be set in config to use this feature')
      return from([])
    }

    return from(inst.config.pinJson(JSON.parse(JSON.stringify(metadata as any))))
      .pipe(first())
      .pipe(map(({ uri }) => parseIPFSHash(uri)))
  }

  function unpinFile(uri: string) {
    if (!inst.config.unpinFile) {
      return from([])
    }
    const hash = parseIPFSHash(uri).ipfsHash
    return inst.config.unpinFile(hash)
  }

  function parseMetadataUrl(url: string) {
    try {
      let newUrl

      if (!url.includes(':')) {
        // string without protocol is assumed to be an IPFS hash
        newUrl = new URL(`ipfs/${url.replace(/\/?(ipfs\/)/, '')}`, inst.config.metadataHost)
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

  return { getMetadata, parseMetadataUrl, pinFile, pinJson, unpinFile }
}

