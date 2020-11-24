import { Injectable } from '@nestjs/common'
import * as postgres from 'postgres'

@Injectable()
export class DatabaseService {
  sql: postgres.Sql<{}> | undefined

  constructor() {
    const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`

    this.sql = postgres(connectionString, {
      transform: {
        column: postgres.toCamel,
      },
    })

    console.log(`Connected to ${connectionString}`)
  }
}
