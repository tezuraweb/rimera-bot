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
        return this.db.select('id', 'name', 'status')
            .from(this.tableName)
            .where({ id })
            .then((data) => data[0]);
    }

    getAll() {
        return this.db.select('id', 'tgchat')
            .from(this.tableName)
            .whereNotNull('tgchat');
    }

    getUsersWithFilter(filter) {
        if (filter.department.length > 0 && filter.organizations.length > 0 && filter.position.length > 0) {
            return this.db.select('id', 'tgchat')
                .from(this.tableName)
                .whereNotNull('tgchat')
                .whereIn('department', filter.department)
                .orWhereIn('organization', filter.organizations)
                .orWhereIn('position', filter.position);
        } else if (filter.department.length > 0 && filter.organizations.length > 0) {
            return this.db.select('id', 'tgchat')
                .from(this.tableName)
                .whereNotNull('tgchat')
                .whereIn('department', filter.department)
                .orWhereIn('organization', filter.organizations);
        } else if (filter.department.length > 0 && filter.position.length > 0) {
            return this.db.select('id', 'tgchat')
                .from(this.tableName)
                .whereNotNull('tgchat')
                .whereIn('department', filter.department)
                .orWhereIn('position', filter.position);
        } else if (filter.organizations.length > 0 && filter.position.length > 0) {
            return this.db.select('id', 'tgchat')
                .from(this.tableName)
                .whereNotNull('tgchat')
                .orWhereIn('organization', filter.organizations)
                .orWhereIn('position', filter.position);
        } else if (filter.department.length > 0) {
            return this.db.select('id', 'tgchat')
                .from(this.tableName)
                .whereNotNull('tgchat')
                .whereIn('department', filter.department);
        } else if (filter.organizations.length > 0) {
            return this.db.select('id', 'tgchat')
                .from(this.tableName)
                .whereNotNull('tgchat')
                .whereIn('organization', filter.organizations);
        } else if (filter.position.length > 0) {
            return this.db.select('id', 'tgchat')
                .from(this.tableName)
                .whereNotNull('tgchat')
                .whereIn('position', filter.position);
        }
    }

    getPhone(phone) {
        return this.db.select('id', 'name', 'status', 'phone', 'auth_phone')
            .from(this.tableName)
            .where({ phone })
            .then((data) => data[0]);
    }

    signIn(id, chatId, authPhone) {
        return this.db(this.tableName).update({
                'tgchat': chatId,
                'auth_phone': authPhone
            })
            .where({ id })
            .returning('name')
            .then((data) => data[0]);
    }
}

module.exports = new User();