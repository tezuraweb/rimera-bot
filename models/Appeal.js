const database = require('../database');

class Appeal {
    constructor() {
        this.db = database;
        this.tableName = "appeal";
    }

    create(user, text, type) {
        try {
            return this.db(this.tableName).insert({
                    'creator': user,
                    'text': text,
                    'type': type,
                })
                .then((res) => res[0]);
        } catch (err) {
            console.log(err);
        }
    }

    delete(id) {
        return this.db(this.tableName)
            .where({ id })
            .del();
    }

    getFeatures() {
        return this.db.select()
            .from(this.tableName)
            .where({ type: 'feature' });
    }

    getProblems() {
        return this.db.select()
            .from(this.tableName)
            .where({ type: 'problem' });
    }
}

module.exports = new Appeal();