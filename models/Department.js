const database = require('../database');

class Department {
    constructor() {
        this.db = database;
        this.tableName = "departments";
    }

    getRoot() {
        return this.db.select('id', 'name')
            .from(this.tableName)
            .whereNull('parent_id');
    }

    getByIds(ids) {
        return this.db.select('id', 'name')
            .from(this.tableName)
            .whereIn('id', ids);
    }

    getSubdivision(parentId) {
        return this.db.select('id', 'name')
            .from(this.tableName)
            .where({ 'parent_id': parentId });
    }

    getSubdivisionMultiple(parentIds) {
        return this.db.select('id', 'name')
            .from(this.tableName)
            .whereIn('parent_id', parentIds);
    }

    searchAll(query) {
        return this.db.select('id', 'name')
            .from(this.tableName)
            .whereILike('name', `%${query}%`);
    }

    searchSubdivision(query, parentId) {
        return this.db.select('id', 'name')
            .from(this.tableName)
            .where({ 'parent_id': parentId })
            .andWhereILike('name', `%${query}%`);
    }
}

module.exports = new Department();