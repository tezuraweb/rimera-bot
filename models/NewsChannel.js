const database = require('../database');

class NewsChannel {
    constructor() {
        this.db = database;
        this.tableName = 'news_channels';
    }

    async create(newsId, channelId) {
        if (!newsId || !channelId) {
            throw new Error('News ID and Channel ID are required');
        }

        try {
            const [result] = await this.db(this.tableName)
                .insert({
                    news_id: newsId,
                    channel_id: channelId
                })
                .returning('*');

            return result;
        } catch (err) {
            console.error('Error creating news-channel relationship:', err);
            throw err;
        }
    }

    async insertMultiple(newsId, channelIds) {
        if (!newsId || !Array.isArray(channelIds) || channelIds.length === 0) {
            throw new Error('News ID and Channel IDs array are required');
        }

        try {
            const rows = channelIds.map(channelId => ({
                news_id: newsId,
                channel_id: channelId
            }));

            const result = await this.db(this.tableName)
                .insert(rows)
                .returning('*');

            return result;
        } catch (err) {
            console.error('Error creating multiple news-channel relationships:', err);
            throw err;
        }
    }

    async getChannelsByNews(newsId) {
        try {
            const result = await this.db(this.tableName)
                .select('channels.*')
                .join('channels', 'news_channels.channel_id', 'channels.id')
                .where({ news_id: newsId });

            return result;
        } catch (err) {
            console.error('Error fetching news channels:', err);
            throw err;
        }
    }

    async getEntriesByNews(newsId) {
        try {
            const result = await this.db(this.tableName)
                .where({ news_id: newsId });

            return result;
        } catch (err) {
            console.error('Error fetching news channels:', err);
            throw err;
        }
    }

    async getNewsByChannel(channelId) {
        try {
            const result = await this.db(this.tableName)
                .select('news.*')
                .join('news', 'news_channels.news_id', 'news.id')
                .where({ channel_id: channelId });

            return result;
        } catch (err) {
            console.error('Error fetching channel news:', err);
            throw err;
        }
    }

    async delete(id) {
        try {
            await this.db(this.tableName)
                .where({ id })
                .delete();
        } catch (err) {
            console.error('Error removing channel from news:', err);
            throw err;
        }
    }

    async deleteMultiple(ids) {
        try {
            await this.db(this.tableName)
                .whereIn('id', ids)
                .delete();
        } catch (err) {
            console.error('Error removing all channels from news:', err);
            throw err;
        }
    }
}

module.exports = new NewsChannel();