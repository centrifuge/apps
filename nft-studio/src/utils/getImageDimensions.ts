import { getFileDataURI } from './getFileDataURI'

const isImageFile = (file: File): boolean => !!file.type.match(/^image\//)

const cached = new WeakMap<File, [number, number]>()

export async function getImageDimensions(file: File) {
  if (cached.has(file)) return cached.get(file)!
  if (!isImageFile) throw new Error('Not an image file')
  const dataUri = await getFileDataURI(file)

  return new Promise<[number, number]>((res, rej) => {
    const img = document.createElement('img')
    img.addEventListener('load', () => {
      cached.set(file, [img.width, img.height])
      res([img.width, img.height])
    })
    img.addEventListener('error', () => {
      rej('Failed to load image')
    })
    img.src = dataUri
  })
}
