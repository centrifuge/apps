import * as postgres from 'postgres'
import * as shift from 'postgres-shift'
import { config } from 'dotenv'
import * as path from 'path'

config()

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`

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
