/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
        // Emails indexes
        .alterTable('emails', table => {
            table.index('organization');
            table.index('type');
        })
        // FAQ indexes
        .alterTable('faq', table => {
            table.index('category');
        })
        // News-Channels indexes (if needed beyond the automatic index for foreign keys)
        .alterTable('news_channels', table => {
            table.index('news_id');
            table.index('channel_id');
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
        .alterTable('emails', table => {
            table.dropIndex(['organization', 'type']);
        })
        .alterTable('faq', table => {
            table.dropIndex(['category']);
        })
        .alterTable('news_channels', table => {
            table.dropIndex(['news_id', 'channel_id']);
        });
};
