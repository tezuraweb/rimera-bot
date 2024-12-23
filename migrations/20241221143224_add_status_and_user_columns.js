/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
        .table('emails', table => {
            table.integer('user')
                .unsigned()
                .references('id')
                .inTable('users')
                .onDelete('CASCADE');
        })
        .table('news', table => {
            table.boolean('isPublished').defaultTo(false);
        })
        .table('appeal', table => {
            table.boolean('isAnswered').defaultTo(false);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
        .table('emails', table => {
            table.dropColumn('user');
        })
        .table('news', table => {
            table.dropColumn('isPublished');
        })
        .table('appeal', table => {
            table.dropColumn('isAnswered');
        });
};