class Message {
    constructor() {
        this.db = require('../database');
        this.tableName = "messages";
    }

    async create(data) {
        if (!data.name || !data.title || !data.group_id) {
            throw new Error('Missing required fields');
        }

        try {
            const messageData = {
                name: data.name.trim(),
                title: data.title.trim(),
                group_id: data.group_id,
                news_id: data.news || null
            };

            const result = await this.db(this.tableName)
                .insert(messageData)
                .returning(['id', 'name', 'title', 'group_id', 'news_id'])
                .join('news', 'messages.news_id', 'news.id')
                .select('news.text as news_text');

            return result[0];
        } catch (err) {
            console.error('Error creating message:', err);
            throw err;
        }
    }

    async update(id, data) {
        if (!id) {
            throw new Error('Message ID is required');
        }

        try {
            const result = await this.db(this.tableName)
                .where({ id })
                .update({
                    news_id: data.news_id,
                })
                .returning('*')
                .join('news', 'messages.news_id', 'news.id')
                .select('news.text as news_text');

            return result[0];
        } catch (err) {
            console.error('Error updating message:', err);
            throw err;
        }
    }

    async getById(id) {
        if (!id) {
            throw new Error('Message ID is required');
        }

        try {
            const result = await this.db(this.tableName)
                .where({ 'messages.id': id })
                .join('news', 'messages.news_id', 'news.id')
                .select(
                    'messages.*',
                    'news.text as news_text'
                )
                .first();

            return result;
        } catch (err) {
            console.error('Error fetching message:', err);
            throw err;
        }
    }

    async getByName(name) {
        if (!name) {
            throw new Error('Message ID is required');
        }

        try {
            const result = await this.db(this.tableName)
                .where({ name })
                .join('news', 'messages.news_id', 'news.id')
                .select(
                    'messages.*',
                    'news.id as news_id',
                    'news.text as news_text',
                )
                .first();

            return result;
        } catch (err) {
            console.error('Error fetching message:', err);
            throw err;
        }
    }

    async getAll() {
        try {
            const result = await this.db(this.tableName)
                .leftJoin('news', 'messages.news_id', 'news.id')
                .select(
                    'messages.*',
                    'news.text as news_text'
                )
                .orderBy('messages.group_id', 'asc')
                .orderBy('messages.name', 'asc');

            return result;
        } catch (err) {
            console.error('Error fetching all messages:', err);
            throw err;
        }
    }
}

module.exports = new Message();