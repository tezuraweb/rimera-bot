const database = require('../database');

class Auth {
    constructor() {
        this.db = database;
        this.tableName = "auth";
    }

    create(userId, counter = 2, subscription = false) {
        try {
            return this.db(this.tableName)
                .insert({
                    'user_id': userId,
                    'counter': counter,
                    'subscription': subscription,
                })
                .returning('*')
                .then((res) => res[0]);
        } catch (err) {
            console.log(err);
        }
    }

    async getAllUnsubscribed() {
        try {
            return await this.db(this.tableName)
                .select([
                    'auth.*',
                    'users.tgid as telegram_username',
                    'users.tgchat as telegram_id',
                ])
                .from(this.tableName)
                .leftJoin('users', 'users.id', 'auth.user_id')
                .where({ subscription: false });
        } catch (err) {
            console.log(err);
        }
    }

    async getByUserId(userId) {
        try {
            return await this.db(this.tableName)
                .where({ user_id: userId })
                .first();
        } catch (err) {
            console.log(err);
        }
    }

    async updateCounter(userId, counter) {
        try {
            return await this.db(this.tableName)
                .where({ user_id: userId })
                .update({ counter })
                .returning('*')
                .then((res) => res[0]);
        } catch (err) {
            console.log(err);
        }
    }

    async updateSubscription(userId, subscription) {
        try {
            return await this.db(this.tableName)
                .where({ user_id: userId })
                .update({ subscription })
                .returning('*')
                .then((res) => res[0]);
        } catch (err) {
            console.log(err);
        }
    }

    async update(userId, data) {
        try {
            return await this.db(this.tableName)
                .where({ user_id: userId })
                .update(data)
                .returning('*')
                .then((res) => res[0]);
        } catch (err) {
            console.log(err);
        }
    }

    delete(userId) {
        return this.db(this.tableName)
            .where({ user_id: userId })
            .del();
    }
}

module.exports = new Auth();