const database = require('../database');

class Channel {
    constructor() {
        this.db = database;
        this.tableName = 'channels';
    }

    async create(data) {
        if (!data.link) {
            throw new Error('Channel link is required');
        }

        try {
            const [result] = await this.db(this.tableName)
                .insert({
                    link: data.link.trim(),
                    name: data.name?.trim()
                })
                .returning('*');

            return result;
        } catch (err) {
            console.error('Error creating channel:', err);
            throw err;
        }
    }

    async update(id, data) {
        if (!id) throw new Error('Channel ID is required');

        try {
            const [result] = await this.db(this.tableName)
                .where({ id })
                .update({
                    link: data.link?.trim(),
                    name: data.name?.trim(),
                })
                .returning('*');

            return result;
        } catch (err) {
            console.error('Error updating channel:', err);
            throw err;
        }
    }

    async delete(id) {
        if (!id) throw new Error('Channel ID is required');

        try {
            await this.db(this.tableName)
                .where({ id })
                .delete();
        } catch (err) {
            console.error('Error deleting channel:', err);
            throw err;
        }
    }

    async getById(id) {
        if (!id) throw new Error('Channel ID is required');

        try {
            const result = await this.db(this.tableName)
                .where({ id })
                .first();

            return result;
        } catch (err) {
            console.error('Error fetching channel:', err);
            throw err;
        }
    }

    async getAll() {
        try {
            const result = await this.db(this.tableName)
                .orderBy('id', 'desc');

            return result;
        } catch (err) {
            console.error('Error fetching channels:', err);
            throw err;
        }
    }
}

module.exports = new Channel();