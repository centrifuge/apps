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
    type: 'any',
  },
  properties: {
    type: 'any',
    optional: true,
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
    type: 'any',
    optional: true,
  },
} as const
