import Centrifuge, { FileType } from '@centrifuge/centrifuge-js'
import { lastValueFrom } from 'rxjs'
import { getFileDataURI } from '../../../src/utils/getFileDataURI'

export const pinFile = async (centrifuge: Centrifuge, file: File): Promise<FileType> => {
  const pinned = await lastValueFrom(centrifuge.metadata.pinFile(await getFileDataURI(file)))
  return { uri: pinned.uri, mime: file.type }
}

export const pinFileIfExists = async (centrifuge: Centrifuge, file: File | null) =>
  file ? pinFile(centrifuge, file) : null

export const pinFiles = async (centrifuge: Centrifuge, files: { [key: string]: File | null }) => {
  const promises = Object.entries(files).map(async ([key, file]) => {
    const pinnedFile = await pinFileIfExists(centrifuge, file)
    return { key, pinnedFile }
  })

  const results = await Promise.all(promises)

  return results.reduce((acc, { key, pinnedFile }) => {
    if (pinnedFile) {
      acc[key] = {
        uri: pinnedFile.uri,
        mime: files[key]?.type || '',
      }
    } else {
      acc[key] = null
    }
    return acc
  }, {} as { [key: string]: { uri: string; mime: string } | null })
}
