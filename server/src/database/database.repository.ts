import * as Nedb from 'nedb';
import * as util from 'util';

/**
 * A repository class for accessing database data. Class methods promisify the equivalent Nedb methods
 * @type T - the entity model as saved in the database
 */
export class DatabaseRepository<T> {
  constructor(private readonly databaseConnection: Nedb) {}

  /**
   * Inserts an object in the collection.
   * @param {T} object
   */
  async create(object: T) {
    return await util.promisify(
      this.databaseConnection.insert.bind(this.databaseConnection),
    )(object);
  }

  /**
   * Find a list of objects from the database, based on a specified query. Directly passes the query specified to Nedb.
   * @link https://github.com/louischatriot/nedb#finding-documents The querying objects supported by Nedb.
   * @param {any} query - Nedb query object
   * @returns {Promise<T[]>} promise
   */
  async find(query: any) {
    const cursor = this.databaseConnection.find(query);
    return util.promisify(cursor.exec.bind(cursor))();
  }

  /**
   * Find a single objects from the database, based on a specified query. Directly passes the query specified to Nedb.
   * @link https://github.com/louischatriot/nedb#finding-documents The querying objects supported by Nedb.
   * @param {any} query - Nedb query object
   * @returns {Promise<T|null>} promise
   */
  async findOne(query: any) {
    return util.promisify(
      this.databaseConnection.findOne.bind(this.databaseConnection),
    )(query);
  }

  /**
   * Update object by id
   * @param {string} id - The object identifier
   * @param {object} updateObject - The update object query
   * @returns {Promise<T|null>} promise
   */
  async updateById(id: string, updateObject: T) {
    return util.promisify(
      this.databaseConnection.update.bind(this.databaseConnection),
    )({ _id: id }, updateObject);
  }
}
