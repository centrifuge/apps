import { FileUpload } from '@centrifuge/fabric'
import { useFormikContext } from 'formik'

const parseCSVLine = (line: string): string[] => {
  const result: string[] = []
  let cur = '',
    inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cur)
  return result
}

interface CsvResult {
  headers: string[]
  data: Array<Record<string, string | number>>
}

const csvToJson = (csv: string): CsvResult => {
  const lines = csv.trim().split(/\r?\n/)
  if (lines.length < 2) {
    return { headers: [], data: [] }
  }

  const headers = parseCSVLine(lines[0])
  const data: Array<Record<string, string | number>> = []

  for (const line of lines.slice(1)) {
    const values = parseCSVLine(line)
    const row: Record<string, string | number> = {}

    headers.forEach((h, i) => {
      const raw = values[i] ?? ''
      const parsed = raw.trim() === '' ? raw : !isNaN(Number(raw)) ? Number(raw) : raw
      row[h] = parsed
    })

    data.push(row)
  }

  return { headers, data }
}

export function AssetCsvUpload() {
  const form = useFormikContext()

  const uploadAsset = async (file: File | null) => {
    if (!file) return
    const text = await file.text()
    const result = csvToJson(text)
    form.setFieldValue('holdings', result)
  }

  return <FileUpload accept=".csv" placeholder="Upload holdings CSV" onFileChange={uploadAsset} />
}
