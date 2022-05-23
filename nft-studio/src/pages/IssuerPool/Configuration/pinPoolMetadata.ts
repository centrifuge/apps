import { fetchLambda } from '../../../utils/fetchLambda'

export const pinPoolMetadata = async (metadata: string): Promise<string> => {
  const resp = await fetchLambda('pinJson', { method: 'POST', body: metadata })
  if (!resp.ok) {
    const respText = await resp.text()
    throw new Error(`Error pinning pool metadata: ${respText}`)
  }
  const json = await resp.json()
  return json.ipfsHash as string
}
