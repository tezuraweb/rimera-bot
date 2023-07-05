const database = require('../database');

class Organization {
    constructor() {
        this.db = database;
        this.tableName = "organizations";
    }

    getAll() {
        return this.db.select('id', 'name')
            .from(this.tableName);
    }

    getByIds(ids) {
        return this.db.select('id', 'name')
            .from(this.tableName)
            .whereIn('id', ids);
    }

    searchAll(query) {
        return this.db.select('id', 'name')
            .from(this.tableName)
            .whereILike('name', `%${query}%`);
    }
}

module.exports = new Organization();