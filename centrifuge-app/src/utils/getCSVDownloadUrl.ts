export function getCSVDownloadUrl(data: { [key: string]: string | number }[]) {
  const csvContent = [
    Object.keys(data[0]), // column headers
    ...data.map((entry) => Object.values(entry)), // columns
  ]
    .map((row) => `${row.join(',')}\n`)
    .join('')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8,' })
  return URL.createObjectURL(blob)
}
