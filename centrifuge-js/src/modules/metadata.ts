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

  function pinFile(metadata: {
    fileDataUri?: string
    fileName?: string
  }): Observable<{ uri: string; ipfsHash: string }> {
    if (!inst.config?.pinFile) {
      console.error('pinFile must be set in config to use this feature')
      return from([])
    }
    if (!metadata.fileDataUri || !metadata.fileName) {
      console.error('fileDataUri or fileName not provided')
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
    if (!inst.config.pinFile) {
      console.error('pinFile must be set in config to use this feature')
      return from([])
    }

    const file = jsonToBase64(metadata)

    return from(
      inst.config.pinFile({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fileDataUri: file, fileName: `pin-file-${Math.random().toString().slice(8)}` }),
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

function jsonToBase64(jsonInput: Record<any, any>) {
  try {
    const json = JSON.stringify(jsonInput)
    return btoa(json)
  } catch (error) {
    throw new Error('Invalid JSON')
  }
}
