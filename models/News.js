const database = require('../database');

class News {
    constructor() {
        this.db = database;
        this.tableName = "news";
    }

    async getPage(page, limit, isTemplate = false) {
        limit = parseInt(limit) || 5;
        const offset = (page - 1) * limit;

        const result = await this.db
            .select([
                '*',
                this.db.raw('count(*) OVER() as total_count'),
                this.db.raw(`(
                    SELECT tgid 
                    FROM users 
                    WHERE users.id = ${this.tableName}.creator 
                    LIMIT 1
                ) AS username`)
            ])
            .from(this.tableName)
            .where({ template: isTemplate })
            .orderBy('id', 'desc')
            .limit(limit)
            .offset(offset);

        const total = result[0]?.total_count || 0;
        
        return {
            data: result.map(row => {
                const { total_count, ...newsData } = row;
                return newsData;
            }),
            total
        };
    }

    async getInbox() {
        return this.db.select('id', 'text', 'files', 'creator')
            .from(this.tableName)
            .where({ template: false });
    }

    async addPost(userId, data) {
        if (!userId || !data.newsText) {
            throw new Error('Missing required fields');
        }

        const newsData = {
            text: data.newsText.trim(),
            files: data.photo || null,
            creator: userId,
            template: !!data.template,
        };

        const [id] = await this.db(this.tableName)
            .insert(newsData)
            .returning('id');

        return id;
    }

    async update(id, text) {
        if (!id || typeof text !== 'string') {
            throw new Error('Invalid input parameters');
        }

        try {
            const result = await this.db(this.tableName)
                .where({ id })
                .update({
                    text: text.trim(),
                })
                .returning('*');

            return result[0];
        } catch (err) {
            console.error('Error updating news:', err);
            throw err;
        }
    }

    async deleteNews(id) {
        if (!id) {
            throw new Error('News ID is required');
        }

        return this.db(this.tableName)
            .where({ id })
            .del()
            .returning('id');
    }
}

module.exports = new News();