import * as Nedb from 'nedb';
import * as util from 'util';

export class DatabaseRepository<T> {
  constructor(private readonly databaseConnection: Nedb) {}

  async create(object: T) {
    return await util.promisify(
      this.databaseConnection.insert.bind(this.databaseConnection),
    )(object);
  }

  async get() {
    return this._findByQuery({});
  }

  async find(query: any) {
    return this._findByQuery(query);
  }

  async findOne(query: any) {
    return util.promisify(
      this.databaseConnection.findOne.bind(this.databaseConnection),
    )(query);
  }

  private async _findByQuery(query: any) {
    const cursor = this.databaseConnection.find(query);
    return util.promisify(cursor.exec.bind(cursor))();
  }
}
