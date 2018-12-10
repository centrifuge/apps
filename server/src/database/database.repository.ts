import * as Nedb from 'nedb';
import * as util from 'util';

export class DatabaseRepository<T> {
  constructor(private readonly databaseConnection: Nedb) {}

  async create(object: T) {
    return await util.promisify(
      this.databaseConnection.insert.bind(this.databaseConnection),
    )(object);
  }

  async find(query: any) {
    const cursor = this.databaseConnection.find(query);
    return util.promisify(cursor.exec.bind(cursor))();
  }

  async findOne(query: any) {
    return util.promisify(
      this.databaseConnection.findOne.bind(this.databaseConnection),
    )(query);
  }
}
