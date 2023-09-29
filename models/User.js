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
        return this.db.select('id', 'tgchat', 'name', 'tgid', 'status')
            .from(this.tableName)
            .where({ id })
            .then((data) => data[0]);
    }

    getUsersByIds(ids) {
        return this.db.select('id', 'tgchat', 'name', 'status')
            .from(this.tableName)
            .whereNotNull('tgchat')
            .whereIn('id', ids);
    }

    getAll() {
        return this.db.select('id', 'tgchat', 'name', 'tgid')
            .from(this.tableName)
            .whereNotNull('tgchat');
    }

    getByIds(ids) {
        return this.db.select('id', 'name', 'tgid')
            .from(this.tableName)
            .whereNotNull('tgchat')
            .whereIn('id', ids);
    }
    
    getUserByDuty(duty) {
        return this.db.select('id', 'tgchat', 'name', 'tgid', 'status')
            .from(this.tableName)
            .where({ duty })
            .then((data) => data[0]);
    }

    searchAll(query) {
        return this.db.select('id', 'name', 'tgid')
            .from(this.tableName)
            .whereNotNull('tgchat')
            .whereILike('name', `%${query}%`)
            .orWhereILike('tgid', `%${query}%`);
    }

    getStats() {
        return this.db.select('status')
            .from(this.tableName)
            .count('* as total_count')
            .select(this.db.raw('SUM(CASE WHEN "tgchat" IS NOT NULL THEN 1 ELSE 0 END) as tgchat_count'))
            .groupBy('status')
            .then(data => {
                let dataDict = data.reduce((acc, curr) => {
                    acc[curr.status] = {
                        total_count: curr.total_count,
                        tgchat_count: curr.tgchat_count,
                    }

                    return acc;
                }, {})
                
                return dataDict;
            })
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

    getByNumber(number) {
        return this.db.select('id', 'name', 'status', 'phone')
            .from(this.tableName)
            .modify((queryBuilder) => {
                if (number.length >= 10 && number.length <= 12) {
                    if (number.length == 10) {
                        queryBuilder.whereILike('phone', `%${number}`);
                    } else if (number.length == 11) {
                        queryBuilder.whereILike('phone', `%${number.slice(1)}`);
                    } else {
                        queryBuilder.whereILike('phone', `%${number.slice(2)}`);
                    }
                } else {
                    queryBuilder.where({ 'user_outer_id': number });
                }
            })
            .then((data) => data[0]);
    }

    signIn(id, chatId, username) {
        return this.db(this.tableName).update({
                'tgid': username,
                'tgchat': chatId,
                // 'auth_phone': authPhone
            })
            .where({ id })
            .returning('name')
            .then((data) => data[0]);
    }

    backofficeCheck(number) {
        return this.db.select('id', 'name', 'status', 'password')
            .from(this.tableName)
            .modify((queryBuilder) => {
                if (number.length >= 10 && number.length <= 12) {
                    if (number.length == 10) {
                        queryBuilder.whereILike('phone', `%${number}`);
                    } else if (number.length == 11) {
                        queryBuilder.whereILike('phone', `%${number.slice(1)}`);
                    } else {
                        queryBuilder.whereILike('phone', `%${number.slice(2)}`);
                    }
                } else {
                    queryBuilder.where({ 'user_outer_id': number });
                }
            })
            .then((data) => data[0]);
    }

    backofficeSignUp(id, password) {
            return this.db(this.tableName).update({
                'password': password
            })
            .where({ id })
            .returning('name')
            .then((data) => data[0]);
    }
}

module.exports = new User();