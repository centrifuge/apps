import * as postgres from 'postgres'
import * as fs from 'fs'
import { config } from 'dotenv'
import * as path from 'path'

config()

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`

const sql = postgres(connectionString)
const seedFolder = path.join(__dirname, 'seeds')

let files = fs.readdirSync(seedFolder)

// Sort seed files by index
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
files.sort(collator.compare)

// Apply seeds
files.forEach(async (file: string) => {
  console.log(path.join(seedFolder, file))
  await sql.file(path.join(seedFolder, file))
})

console.log('OK')
process.exit(0)
