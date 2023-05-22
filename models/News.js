const database = require('../database');

class News {
    constructor() {
        this.db = database;
        this.tableName = "news";
    }

    addPost(userId, data) {
        return this.db(this.tableName).insert({
                'text': data.newsText,
                'files': data.photo,
                'creator': userId
            })
            .returning('id')
            .then((data) => data[0]);
    }

    publishNews(id) {
        return this.db(this.tableName).update({
                'published': true
            })
            .where({ id })
            .returning('id')
            .then((data) => data[0]);
    }

    getInbox() {
        return this.db.select('id', 'text', 'files', 'creator')
            .from(this.tableName)
            .where({ published: false });
    }
}

module.exports = new News();