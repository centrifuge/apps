"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DataStore = require("nedb-promises");
class DatabaseRepository {
    constructor(options) {
        this.options = options;
        const defaultOptions = {
            timestampData: true,
        };
        this.repository = DataStore.create(Object.assign({}, defaultOptions, options));
    }
    insert(object) {
        return this.repository.insert(object);
    }
    find(query) {
        return this.repository.find(query).exec();
    }
    getCursor(query) {
        return this.repository.find(query);
    }
    findOne(query) {
        return this.repository.findOne(query);
    }
    updateById(id, updateObject, upsert = false) {
        return this.update({ _id: id }, updateObject, { returnUpdatedDocs: true, upsert });
    }
    update(query, updateObject, options) {
        return this.repository.update(query, updateObject, options);
    }
}
exports.DatabaseRepository = DatabaseRepository;
;
//# sourceMappingURL=database.repository.js.map