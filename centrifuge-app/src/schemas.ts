export const nftMetadataSchema = {
  name: {
    type: 'string',
    maxLength: 40,
  },
  description: {
    type: 'string',
    maxLength: 400,
  },
  image: {
    type: 'string',
  },
} as const

export const collectionMetadataSchema = {
  name: {
    type: 'string',
    maxLength: 40,
  },
  description: {
    type: 'string',
    maxLength: 400,
  },
  image: {
    type: 'string',
    optional: true,
  },
} as const
