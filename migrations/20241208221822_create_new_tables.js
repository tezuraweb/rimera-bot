/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
        // Channels table
        .createTable('channels', table => {
            table.increments('id').primary();
            table.string('link').notNullable();
            table.string('name');
            table.timestamps(true, true);
        })
        
        // Emails table
        .createTable('emails', table => {
            table.increments('id').primary();
            table.string('address').notNullable();
            table.string('type');
            table.integer('organization')
                .unsigned()
                .references('id')
                .inTable('organizations');
            table.timestamps(true, true);
        })
        
        // FAQ table
        .createTable('faq', table => {
            table.increments('id').primary();
            table.string('category');
            table.string('question');
            table.text('answer');
            table.timestamps(true, true);
        })
        
        // News-Channels junction table
        .createTable('news_channels', table => {
            table.increments('id').primary();
            table.integer('news_id')
                .unsigned()
                .references('id')
                .inTable('news')
                .onDelete('CASCADE');
            table.integer('channel_id')
                .unsigned()
                .references('id')
                .inTable('channels')
                .onDelete('CASCADE');
            table.unique(['news_id', 'channel_id']);
            table.timestamps(true, true);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
        .dropTableIfExists('news_channels')
        .dropTableIfExists('faq')
        .dropTableIfExists('emails')
        .dropTableIfExists('channels');
};
