export function createDownloadJson(data: any, fileName: string) {
  const jsonString = JSON.stringify(data, null, 2)

  const blob = new Blob([jsonString], { type: 'application/json' })

  const url = URL.createObjectURL(blob)

  return { url, fileName, revoke: () => URL.revokeObjectURL(url) }
}
