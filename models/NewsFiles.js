const database = require('../database');

class NewsFiles {
    constructor() {
        this.db = database;
        this.tableName = "news_files";
    }

    create(fileData) {
        return this.db(this.tableName)
            .insert({
                news_id: fileData.news_id,
                file_id: fileData.file_id,
                type: fileData.type
            })
            .returning(['id', 'news_id', 'file_id', 'type', 'created_at']);
    }

    update(id, fileData) {
        return this.db(this.tableName)
            .where('id', id)
            .update({
                file_id: fileData.file_id,
                type: fileData.type,
                updated_at: this.db.fn.now()
            })
            .returning(['id', 'news_id', 'file_id', 'type', 'updated_at']);
    }

    delete(id) {
        return this.db(this.tableName)
            .where('id', id)
            .del();
    }

    getFilesByNews(newsId) {
        return this.db(this.tableName)
            .where('news_id', newsId)
            .select('*')
            .orderBy('created_at', 'asc');
    }

    insertMultiple(files) {
        const filesWithTimestamps = files.map(file => ({
            news_id: file.news_id,
            file_id: file.file_id,
            type: file.type,
            created_at: this.db.fn.now(),
            updated_at: this.db.fn.now()
        }));

        return this.db(this.tableName)
            .insert(filesWithTimestamps)
            .returning(['id', 'news_id', 'file_id', 'type', 'created_at']);
    }
}

module.exports = new NewsFiles();