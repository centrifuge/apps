import * as DataStore from 'nedb-promises';
import * as Nedb from 'nedb';
import { DataStoreOptions, EnsureIndexOptions } from 'nedb';

const COMPACTION_INTERVAL = 1000 * 60 * 30;
/**
 * A repository class for accessing database data. Class methods promisify the equivalent Nedb methods
 * @type T - the entity model as saved in the database
 */
export class DatabaseRepository<T> {
  private repository: DataStore;

  constructor(private readonly options: DataStoreOptions) {
    const defaultOptions: DataStoreOptions = {
      timestampData: true,
    };

    this.repository = DataStore.create({
      ...defaultOptions,
      ...options,
    });

    if (process.env.NODE_ENV !== 'test')
      this.repository.persistence.setAutocompactionInterval(
        COMPACTION_INTERVAL,
      );
  }

  /**
   * Inserts an object in the collection.
   * @param {T} object
   */
  insert(object: T): Promise<T> {
    return this.repository.insert(object);
  }

  /**
   * Find a list of objects from the database, based on a specified query. Directly passes the query specified to Nedb.
   * @link https://github.com/louischatriot/nedb#finding-documents The querying objects supported by Nedb.
   * @param {any} query - Nedb query object
   * @returns {Promise<T[]>} promise
   */
  find(query: any): Promise<T[]> {
    return this.repository.find(query).exec();
  }

  getCursor(query?: any): any {
    return this.repository.find(query);
  }

  /**
   * Find a single objects from the database, based on a specified query. Directly passes the query specified to Nedb.
   * @link https://github.com/louischatriot/nedb#finding-documents The querying objects supported by Nedb.
   * @param {any} query - Nedb query object
   * @returns {Promise<T|null>} promise
   */
  findOne(query: any): Promise<T | null> {
    return this.repository.findOne(query);
  }

  /**
   * Update object by id
   * @param {string} id - The object identifier
   * @param {object} updateObject - The update object query
   * @returns {Promise<T|null>} promise
   */
  updateById(
    id: string | undefined,
    updateObject: Modifier<T> | T,
    upsert: boolean = false,
  ): Promise<T | null> {
    return this.update({ _id: id }, updateObject, {
      returnUpdatedDocs: true,
      upsert,
    }) as Promise<T | null>;
  }

  /**
   * Update object
   * @param {any} query - Nedb query object
   * @param {object} updateObject - The update object query
   * @param {Nedb.UpdateOptions} options - {multi,upsert,returnUpdatedDocs}
   * @returns {Promise<T|null>} promise
   */
  update(
    query: any,
    updateObject: Modifier<T> | T,
    options?: Nedb.UpdateOptions,
  ): Promise<T | null | number> {
    return this.repository.update(query, updateObject, options);
  }

  /**
   * Ensures an index of the table
   * @param {EnsureIndexOptions} options
   */
  ensureIndex(options: EnsureIndexOptions): Promise<undefined> {
    return this.repository.ensureIndex(options);
  }

  /**
   * Ensures an index of the table
   * @param {EnsureIndexOptions} options
   */
  remove(query: any): Promise<number> {
    return this.repository.remove(query);
  }
}

interface Modifier<T> {
  $set?: Partial<T>;
  $push?: any;
  $pop?: Partial<T>;
}
