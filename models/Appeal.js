const database = require('../database');

class Appeal {
    constructor() {
        this.db = database;
        this.tableName = "appeal";
    }

    async create(text, type, creator, organization) {
        try {
            const [id] = await this.db(this.tableName).insert({
                'creator': creator,
                'organization': organization,
                'text': text,
                'type': type,
            })
            .returning('id');

            return id;
        } catch (err) {
            console.error(err);
        }
    }

    async updateResponded(id) {
        if (!id) {
            throw new Error('Appeal ID is required');
        }

        try {
            const result = await this.db(this.tableName)
                .where({ id })
                .update({
                    isAnswered: true,
                })
                .returning('*');

            return result[0];
        } catch (err) {
            console.error('Error updating appeal:', err);
            throw err;
        }
    }

    delete(id) {
        return this.db(this.tableName)
            .where({ id })
            .del();
    }

    getById(id) {
        return this.db
            .select([
                'appeal.*',
                'users.tgchat as tgchat',
            ])
            .from(this.tableName)
            .leftJoin('users', 'users.id', 'appeal.creator')
            .where({ 'appeal.id': id })
            .first();
    }

    getByOrgAndType(orgs, types) {
        return this.db.select()
            .from(this.tableName)
            .whereIn('organization', orgs)
            .whereIn('type', types)
            .where({ 'isAnswered': false });
    }

    async getPage(page, limit, isResponded = false) {
        limit = parseInt(limit) || 5;
        const offset = (page - 1) * limit;

        const result = await this.db
            .select([
                'appeal.*',
                'users.tgid as username',
                'organizations.name as orgname',
                this.db.raw('count(*) OVER() as total')
            ])
            .from(this.tableName)
            .leftJoin('users', 'users.id', 'appeal.creator')
            .leftJoin('organizations', 'organizations.id', 'appeal.organization')
            .where('appeal.isAnswered', isResponded)
            .orderBy('appeal.id', 'DESC')
            .limit(limit)
            .offset(offset);

        return {
            data: result,
            total: result.length > 0 ? parseInt(result[0].total) : 0
        };
    }
}

module.exports = new Appeal();