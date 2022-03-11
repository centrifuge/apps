import { fetchLambda } from './fetchLambda'
import { getFileDataURI } from './getFileDataURI'

export const getFileIpfsHash = async (file?: File): Promise<string | null> => {
  if (!file) return null

  const resp = await fetchLambda('pinFile', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      fileDataUri: await getFileDataURI(file),
      fileName: file.name,
    }),
  })

  if (resp.ok && Math.floor(resp.status) / 100 === 2) {
    const json = await resp.json()
    return json.fileIpfsHash as string
  }
  return null
}
