/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
        .createTable('auth', table => {
            table.increments('id').primary();
            table.integer('user_id')
                .unsigned()
                .references('id')
                .inTable('users')
                .onDelete('CASCADE')
                .notNullable();
            table.integer('counter').defaultTo(0);
            table.boolean('subscription').defaultTo(false);
            table.timestamps(true, true);
            table.unique(['user_id']);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
        .dropTableIfExists('auth');
};