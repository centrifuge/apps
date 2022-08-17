import { useQuery } from 'react-query'
import { useCentrifuge } from '../components/CentrifugeProvider'

export function useFile(uri: string | undefined | null, fileName: string) {
  const cent = useCentrifuge()
  const query = useQuery(
    ['file', uri],
    async () => {
      const url = cent.metadata.parseMetadataUrl(uri!)
      const blob = await fetch(url).then((res) => res.blob())
      const file = new File([blob], `${fileName}.${getExtension(blob.type as any)}`, { type: blob.type })
      return file
    },
    {
      enabled: !!uri,
      staleTime: Infinity,
    }
  )

  return query
}
const extensions = {
  'image/png': 'png',
  'image/avif': 'avif',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/vnd.microsoft.icon': 'ico',
}
function getExtension(mime: keyof typeof extensions) {
  return extensions[mime]
}
