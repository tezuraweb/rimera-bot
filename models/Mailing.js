const database = require('../database');

class Mailing {
    constructor() {
        this.db = database;
        this.tableName = "mailing";
    }

    getAll() {
        try {
            return this.db.select('id', 'name')
                .from(this.tableName);
                // .where({ status: 'pending' });
        } catch (err) {
            console.log(err);
        }
    }

    getById(id) {
        try {
            return this.db.select()
                .from(this.tableName)
                .where({ id })
                .then((data) => data[0]);
        } catch (err) {
            console.log(err);
        }
    }

    create(data) {
        try {
            return this.db(this.tableName).insert({
                    'name': data.title,
                    'organization_filter': data.organization,
                    'department_filter': data.department,
                    'user_filter': data.users,
                    'position_filter': data.position,
                    'gender_filter': data.gender,
                    'sending_date': data.date,
                })
                .then((res) => res[0]);
        } catch (err) {
            console.log(err);
        }
    }

    update(id, data) {
        try {
            return this.db(this.tableName).update({
                    'name': data.title,
                    'organization_filter': data.organization,
                    'department_filter': data.department,
                    'user_filter': data.users,
                    'position_filter': data.position,
                    'gender_filter': data.gender,
                    'sending_date': data.date,
                })
                .where({ id })
                .then((res) => res[0]);
        } catch (err) {
            console.log(err);
        }
    }

    async delete(id) {
        if (!id) throw new Error('Mailing ID is required');

        try {
            await this.db(this.tableName)
                .where({ id })
                .delete();
        } catch (err) {
            console.error('Error deleting mailing:', err);
            throw err;
        }
    }
}

module.exports = new Mailing();