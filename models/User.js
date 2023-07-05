const database = require('../database');

class User {
    constructor() {
        this.db = database;
        this.tableName = "users";
    }

    getUser(chatId) {
        return this.db.select('id', 'name', 'status')
            .from(this.tableName)
            .where({ tgchat: chatId })
            .then((data) => data[0]);
    }

    getUserById(id) {
        return this.db.select('id', 'name', 'tgid', 'status')
            .from(this.tableName)
            .where({ id })
            .then((data) => data[0]);
    }

    getUsersByIds(ids) {
        return this.db.select('id', 'name', 'status')
            .from(this.tableName)
            .whereIn('id', ids);
    }

    getAll() {
        return this.db.select('id', 'tgchat')
            .from(this.tableName)
            .whereNotNull('tgchat');
    }

    getUsersWithFilter(filter) {
        return this.db.select('id', 'tgchat')
            .from(this.tableName)
            .whereNotNull('tgchat')
            .modify((queryBuilder) => {
                if (filter.organization !== null && filter.organization.length > 0) {
                    queryBuilder.whereIn('organization', filter.organization);
                }
                if (filter.department !== null && filter.department.length > 0) {
                    queryBuilder.whereIn('department', filter.department);
                }
                if (filter.position !== null && filter.position.length > 0) {
                    if (filter.position.length == 1) {
                        queryBuilder.whereIn('position', this.db.raw('SELECT id FROM position WHERE category = ?', [filter.position[0]]));
                    }
                }
                if (filter.gender !== null && filter.gender.length > 0) {
                    queryBuilder.where({'gender': filter.gender[0]});
                }
            });
    }

    getPhone(phone) {
        return this.db.select('id', 'name', 'status', 'phone', 'auth_phone')
            .from(this.tableName)
            .where({ phone })
            .then((data) => data[0]);
    }

    signIn(id, chatId, username, authPhone) {
        return this.db(this.tableName).update({
                'tgid': username,
                'tgchat': chatId,
                'auth_phone': authPhone
            })
            .where({ id })
            .returning('name')
            .then((data) => data[0]);
    }
}

module.exports = new User();