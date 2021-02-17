import { Injectable } from '@nestjs/common'
import * as postgres from 'postgres'
import config from '../config'

@Injectable()
export class DatabaseService {
  sql: postgres.Sql<{}>

  constructor() {
    const connectionString = `postgres://${config.db.username}:${config.db.password}@${config.db.host}:${config.db.port}/${config.db.name}`

    this.sql = postgres(connectionString, {
      transform: {
        column: postgres.toCamel,
      },
    })
  }
}
