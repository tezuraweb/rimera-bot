/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .alterTable('appeal', table => {
            table.integer('organization')
                .unsigned()
                .references('id')
                .inTable('organizations');
        })
        .alterTable('news', table => {
            table.boolean('published')
                .defaultTo(false);
        })
        .alterTable('organizations', table => {
            table.boolean('for_bot')
                .defaultTo(false);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema
        .alterTable('appeal', table => {
            table.dropColumn('organization');
        })
        .alterTable('news', table => {
            table.dropColumn('published');
        })
        .alterTable('organizations', table => {
            table.dropColumn('for_bot');
        });
};
