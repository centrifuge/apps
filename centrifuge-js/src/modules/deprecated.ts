const versionMap = {
  collectionMetadataOf: 'classMetadataOf',
  collection: 'class',
  itemMetadataOf: 'instanceMetadataOf',
  item: 'instance',
  items: 'instances',
  poolToLoanNftCollection: 'poolToLoanNftClass',
}

export const deprecationKeys = (version: number, key: keyof typeof versionMap) => {
  if (version < 1007) {
    return versionMap[key]
  }
  return key
}
