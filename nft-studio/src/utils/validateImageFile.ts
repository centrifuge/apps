export const SUPPORTED_IMAGE_TYPES = [
  'image/png',
  'image/avif',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/bmp',
  'image/vnd.microsoft.icon',
]

export const SUPPORTED_IMAGE_TYPES_STRING = SUPPORTED_IMAGE_TYPES.join(',')

export const SUPPORTED_IMAGE_MAX_BYTES = 1e6 // 1 MB

export const validateImageFile = (file: File): string | undefined => {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return 'File format not supported'
  }
  if (file.size > SUPPORTED_IMAGE_MAX_BYTES) {
    return 'File size exceeded'
  }
}
