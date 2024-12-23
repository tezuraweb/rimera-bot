const database = require('../database');

class Email {
    constructor() {
        this.db = database;
        this.tableName = 'emails';
    }

    async create(data) {
        if (!data.address) {
            throw new Error('Email address is required');
        }

        try {
            const [result] = await this.db(this.tableName)
                .insert({
                    address: data.address.trim(),
                    type: data.type?.trim(),
                    organization: data.organization,
                    user: data.user,
                })
                .returning('*');

            return result;
        } catch (err) {
            console.error('Error creating email:', err);
            throw err;
        }
    }

    async update(id, data) {
        if (!id) throw new Error('Email ID is required');

        try {
            const [result] = await this.db(this.tableName)
                .where({ id })
                .update({
                    address: data.address?.trim(),
                    type: data.type?.trim(),
                    organization: data.organization,
                    user: data.user,
                })
                .returning('*');

            return result;
        } catch (err) {
            console.error('Error updating email:', err);
            throw err;
        }
    }

    async getByOrganization(organizationId) {
        try {
            const result = await this.db(this.tableName)
                .where({ organization: organizationId })
                .orderBy('id', 'desc');

            return result;
        } catch (err) {
            console.error('Error fetching organization emails:', err);
            throw err;
        }
    }

    async getByUser(userId) {
        try {
            const result = await this.db(this.tableName)
                .where({ user: userId })
                .orderBy('id', 'desc');

            return result;
        } catch (err) {
            console.error('Error fetching organization emails:', err);
            throw err;
        }
    }

    async getByOrgType(organizationId, type) {
        try {
            const result = await this.db(this.tableName)
                .where({ organization: organizationId })
                .where({ type })
                .orderBy('id', 'desc');

            return result;
        } catch (err) {
            console.error('Error fetching organization emails:', err);
            throw err;
        }
    }

    async getById(id) {
        if (!id) throw new Error('Email ID is required');

        try {
            const result = await this.db(this.tableName)
                .where({ id })
                .first();

            return result;
        } catch (err) {
            console.error('Error fetching email:', err);
            throw err;
        }
    }

    async getAll() {
        try {
            const result = await this.db(this.tableName)
                .orderBy('id', 'desc');

            return result;
        } catch (err) {
            console.error('Error fetching emails:', err);
            throw err;
        }
    }

    async delete(id) {
        if (!id) throw new Error('Email ID is required');

        try {
            await this.db(this.tableName)
                .where({ id })
                .delete();
        } catch (err) {
            console.error('Error deleting email:', err);
            throw err;
        }
    }
}

module.exports = new Email();