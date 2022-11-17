import { config as dotenvConfig } from 'dotenv'
import * as path from 'path'
import * as postgres from 'postgres'
import * as shift from 'postgres-shift'
import config from '../config'

dotenvConfig()

const connectionString = `postgres://${config.db.username}:${config.db.password}@${config.db.host}:${config.db.port}/${config.db.name}`

const sql = postgres(connectionString)

shift({
  sql,
  path: path.join(__dirname, 'migrations'),
})
  .then(() => {
    console.log('OK')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Failed', err)
    process.exit(1)
  })
