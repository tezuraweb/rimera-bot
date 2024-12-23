const database = require('../database');

class FAQ {
    constructor() {
        this.db = database;
        this.tableName = 'faq';
    }

    async create(data) {
        if (!data.question || !data.answer || !data.category) {
            throw new Error('Question and answer are required');
        }

        try {
            const [result] = await this.db(this.tableName)
                .insert({
                    category: data.category?.trim(),
                    question: data.question.trim(),
                    answer: data.answer.trim()
                })
                .returning('*');

            return result;
        } catch (err) {
            console.error('Error creating FAQ:', err);
            throw err;
        }
    }

    async update(id, data) {
        if (!id) throw new Error('FAQ ID is required');

        try {
            const [result] = await this.db(this.tableName)
                .where({ id })
                .update({
                    category: data.category?.trim(),
                    question: data.question?.trim(),
                    answer: data.answer?.trim(),
                })
                .returning('*');

            return result;
        } catch (err) {
            console.error('Error updating FAQ:', err);
            throw err;
        }
    }

    async getByCategory(category) {
        try {
            const result = await this.db(this.tableName)
                .where({ category })
                .orderBy('id', 'desc');

            return result;
        } catch (err) {
            console.error('Error fetching category FAQs:', err);
            throw err;
        }
    }

    async delete(id) {
        if (!id) throw new Error('FAQ ID is required');

        try {
            await this.db(this.tableName)
                .where({ id })
                .delete();
        } catch (err) {
            console.error('Error deleting FAQ:', err);
            throw err;
        }
    }

    async getById(id) {
        if (!id) throw new Error('FAQ ID is required');

        try {
            const result = await this.db(this.tableName)
                .where({ id })
                .first();

            return result;
        } catch (err) {
            console.error('Error fetching FAQ:', err);
            throw err;
        }
    }

    async getAll() {
        try {
            const result = await this.db(this.tableName)
                .orderBy('id', 'desc');

            return result;
        } catch (err) {
            console.error('Error fetching FAQs:', err);
            throw err;
        }
    }
}

module.exports = new FAQ();