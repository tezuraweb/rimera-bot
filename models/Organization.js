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
}

module.exports = new Organization();