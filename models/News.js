const database = require('../database');

class News {
    constructor() {
        this.db = database;
        this.tableName = "news";
    }

    getNewsCount() {
        return this.db(this.tableName)
            .count('id')
            .then((data) => data[0]);
    }

    addPost(userId, data) {
        return this.db(this.tableName).insert({
                'text': data.newsText,
                'files': data.photo,
                'creator': userId,
                'status': 'disposable'
            })
            .returning('id')
            .then((data) => data[0]);
    }

    update(id, text) {
        try {
            return this.db(this.tableName).update({
                    'text': text,
                })
                .where({ id })
                .then((data) => data[0]);
        } catch (err) {
            console.log(err);
        }
    }

    deleteNews(id) {
        return this.db(this.tableName)
            .where({ id })
            .del();
    }

    getInbox() {
        return this.db.select('id', 'text', 'files', 'creator', 'status')
            .from(this.tableName)
            .where({ status: 'disposable' });
    }

    getPage(page, limit) {
        limit = limit || 5;
        let offset = (page - 1) * limit;

        return this.db.select('*', this.db.raw(`(SELECT tgid FROM users WHERE users.id = ${this.tableName}.creator LIMIT 1) AS username`))
            .from(this.tableName)
            .where({ status: 'disposable' })
            .orderBy('id', 'desc')
            .limit(limit)
            .offset(offset);
    }
}

module.exports = new News();