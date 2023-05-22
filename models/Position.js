const database = require('../database');

class Position {
    constructor() {
        this.db = database;
        this.tableName = "position";
    }

    getAll() {
        return this.db.select('id', 'name')
            .from(this.tableName);
    }
}

module.exports = new Position();