const database = require('../database');

class Organization {
    constructor() {
        this.db = database;
        this.tableName = "organizations";
    }

    getAll() {
        return this.db.select('id', 'name', 'for_bot')
            .from(this.tableName);
    }

    getForBot() {
        return this.db.select('id', 'name')
            .from(this.tableName)
            .where({ for_bot: true });
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

    async update(id, enabled) {
        try {
            const result = await this.db(this.tableName)
                .where({ id })
                .update({
                    for_bot: enabled,
                })
                .returning('*');

            return result[0];
        } catch (err) {
            console.error('Error updating organization:', err);
            throw err;
        }
    }
}

module.exports = new Organization();