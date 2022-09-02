import { config as dotenvConfig } from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import * as postgres from 'postgres'
import config from '../config'

dotenvConfig()

const connectionString = `postgres://${config.db.username}:${config.db.password}@${config.db.host}:${config.db.port}/${config.db.name}`

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
