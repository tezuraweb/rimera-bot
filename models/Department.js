const database = require('../database');

class Department {
    constructor() {
        this.db = database;
        this.tableName = "departments";
    }

    getRoot() {
        return this.db.select('id', 'name')
            .from(this.tableName)
            .whereIn('parent_id', [-1, null]);
    }

    getSubdivision(parentIds) {
        return this.db.select('id', 'name')
            .from(this.tableName)
            .whereIn('parent_id', parentIds);
    }
}

module.exports = new Department();