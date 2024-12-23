const database = require('../database');

class News {
    constructor() {
        this.db = database;
        this.tableName = "news";
    }

    async getPage(page, limit, isTemplate = false, isPublished = false) {
        limit = parseInt(limit) || 5;
        const offset = (page - 1) * limit;
    
        const result = await this.db
            .select([
                'news.*',
                'users.tgid as username',
                this.db.raw('count(*) OVER() as total')
            ])
            .from(this.tableName)
            .leftJoin('users', 'users.id', 'news.creator')
            .where('news.template', isTemplate)
            .where('news.isPublished', isPublished)
            .orderBy('news.id', 'DESC')
            .limit(limit)
            .offset(offset);
    
        return {
            data: result,
            total: result.length > 0 ? parseInt(result[0].total) : 0
        };
    }

    async getAll(isTemplate = false) {
        const result = await this.db.select('id', 'text')
            .from(this.tableName)
            .where('template', isTemplate)
            .orderBy('id', 'DESC')
    
        return result;
    }

    async getInbox() {
        return this.db
            .select([
                'news.id',
                'news.text',
                'users.tgid as username',
                this.db.raw('count(*) OVER() as total')
            ])
            .from(this.tableName)
            .leftJoin('users', 'users.id', 'news.creator')
            .where({ template: false })
            .where({ isPublished: false });username
    }

    async getById(id) {
        return this.db
            .from(this.tableName)
            .where({ id })
            .first();
    }

    async addPost(userId, data) {
        if (!userId || !data.newsText) {
            throw new Error('Missing required fields');
        }

        const newsData = {
            text: data.newsText.trim(),
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

    async updatePublish(id) {
        if (!id) {
            throw new Error('Invalid input parameters');
        }

        try {
            const result = await this.db(this.tableName)
                .where({ id })
                .update({
                    isPublished: true,
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