const database = require('../database');

class AppealFiles {
    constructor() {
        this.db = database;
        this.tableName = "appeal_files";
    }

    create(fileData) {
        return this.db(this.tableName)
            .insert({
                appeal_id: fileData.appeal_id,
                file_id: fileData.file_id,
                type: fileData.type
            })
            .returning(['id', 'appeal_id', 'file_id', 'type', 'created_at']);
    }

    update(id, fileData) {
        return this.db(this.tableName)
            .where('id', id)
            .update({
                file_id: fileData.file_id,
                type: fileData.type,
                updated_at: this.db.fn.now()
            })
            .returning(['id', 'appeal_id', 'file_id', 'type', 'updated_at']);
    }

    delete(id) {
        return this.db(this.tableName)
            .where('id', id)
            .del();
    }

    getFilesByAppeal(appealId) {
        return this.db(this.tableName)
            .where('appeal_id', appealId)
            .select('*')
            .orderBy('created_at', 'asc');
    }

    insertMultiple(files) {
        const filesWithTimestamps = files.map(file => ({
            appeal_id: file.appeal_id,
            file_id: file.file_id,
            type: file.type,
            created_at: this.db.fn.now(),
            updated_at: this.db.fn.now()
        }));

        return this.db(this.tableName)
            .insert(filesWithTimestamps)
            .returning(['id', 'appeal_id', 'file_id', 'type', 'created_at']);
    }
}

module.exports = new AppealFiles();