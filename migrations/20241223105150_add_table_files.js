/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
        // 1. Create news_files table
        .createTable('news_files', table => {
            table.increments('id').primary();
            table.integer('news_id')
                .unsigned()
                .references('id')
                .inTable('news')
                .onDelete('CASCADE');
            table.string('file_id').notNullable();
            table.string('type').notNullable();
            table.timestamps(true, true);
        })
        // 2. Create appeal_files table
        .createTable('appeal_files', table => {
            table.increments('id').primary();
            table.integer('appeal_id')
                .unsigned()
                .references('id')
                .inTable('appeal')
                .onDelete('CASCADE');
            table.string('file_id').notNullable();
            table.string('type').notNullable();
            table.timestamps(true, true);
        })
        // 3. Migrate existing data from news.files array to news_files table
        .then(async () => {
            const newsWithFiles = await knex('news')
                .whereNotNull('files')
                .select('id', 'files');

            const filesToInsert = [];
            newsWithFiles.forEach(news => {
                if (Array.isArray(news.files)) {
                    news.files.forEach(fileId => {
                        filesToInsert.push({
                            news_id: news.id,
                            file_id: fileId,
                            type: 'photo',
                            created_at: new Date(),
                            updated_at: new Date()
                        });
                    });
                }
            });

            if (filesToInsert.length > 0) {
                await knex.batchInsert('news_files', filesToInsert, 100);
            }
        })
        // 4. Drop files column from news table
        .then(() => {
            return knex.schema.alterTable('news', table => {
                table.dropColumn('files');
            });
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
        // 1. Add files column back to news table
        .alterTable('news', table => {
            table.specificType('files', 'text ARRAY');
        })
        // 2. Migrate data back from news_files to news.files array
        .then(async () => {
            const files = await knex('news_files')
                .select('news_id', knex.raw('array_agg(file_id) as file_ids'))
                .groupBy('news_id');

            for (const file of files) {
                await knex('news')
                    .where('id', file.news_id)
                    .update({
                        files: file.file_ids
                    });
            }
        })
        // 3. Drop both files tables
        .then(() => knex.schema.dropTableIfExists('appeal_files'))
        .then(() => knex.schema.dropTableIfExists('news_files'));
};