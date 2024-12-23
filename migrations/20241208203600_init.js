/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
        // Organizations table
        .createTable('organizations', table => {
            table.increments('id').primary();
            table.string('name').notNullable();
            table.string('address');
            table.jsonb('contact_info');
            table.boolean('is_active').defaultTo(true);
            table.string('outer_id');
            table.timestamps(true, true);
        })

        // Departments table
        .createTable('departments', table => {
            table.increments('id').primary();
            table.string('name').notNullable();
            table.integer('parent_id').unsigned().references('id').inTable('departments');
            table.integer('organization_id').unsigned().references('id').inTable('organizations');
            table.string('description');
            table.string('outer_id');
            table.timestamps(true, true);
        })

        // Positions table
        .createTable('position', table => {
            table.increments('id').primary();
            table.string('name').notNullable();
            table.string('category');
            table.string('description');
            table.integer('parent_id').unsigned().references('id').inTable('position');
            table.string('outer_id');
            table.timestamps(true, true);
        })

        // Users table
        .createTable('users', table => {
            table.increments('id').primary();
            table.string('name').notNullable();
            table.string('tgid').unique();
            table.string('tgchat').unique();
            table.string('phone').unique();
            table.string('password');
            table.string('user_outer_id');
            table.enum('status', ['admin', 'user']).defaultTo('user');
            table.enum('gender', ['M', 'F']);
            table.boolean('is_active').defaultTo(true);
            table.integer('organization').unsigned().references('id').inTable('organizations');
            table.integer('department').unsigned().references('id').inTable('departments');
            table.integer('position').unsigned().references('id').inTable('position');
            table.timestamp('date_of_birth');
            table.string('auth_phone');
            table.string('auth_number');
            table.timestamp('date_of_employment');
            table.timestamp('date_of_last_transfer');
            table.timestamp('date_of_last_dismissal');
            table.string('duty');
            table.timestamps(true, true);
        })

        // News table
        .createTable('news', table => {
            table.increments('id').primary();
            table.text('text').notNullable();
            table.specificType('files', 'text ARRAY');
            table.integer('creator').unsigned().references('id').inTable('users');
            table.boolean('template').defaultTo(false);
            // table.specificType('channels', 'text ARRAY');
            table.timestamps(true, true);
        })

        // Messages table
        .createTable('messages', table => {
            table.increments('id').primary();
            table.string('name', 100).notNullable();
            table.string('title', 255).notNullable();
            table.integer('group_id').notNullable();
            table.integer('news_id').unsigned().references('id').inTable('news');
            table.timestamps(true, true);
        })

        // Mailing table
        .createTable('mailing', table => {
            table.increments('id').primary();
            table.string('name').notNullable();
            table.specificType('organization_filter', 'integer ARRAY');
            table.specificType('department_filter', 'integer ARRAY');
            table.specificType('user_filter', 'integer ARRAY');
            table.specificType('position_filter', 'integer ARRAY'); //change to enum
            table.string('gender_filter'); //change to enum
            table.timestamp('sending_date');
            table.enum('status', ['pending', 'processing', 'completed', 'failed']).defaultTo('pending');
            table.specificType('age_filter', 'integer ARRAY');
            table.integer('creator').unsigned().references('id').inTable('users');
            // table.specificType('channels', 'text ARRAY'); ???
            table.timestamps(true, true);
        })

        // Added new table
        .createTable('appeal', table => {
            table.increments('id').primary();
            table.integer('creator').unsigned().references('id').inTable('users');
            table.text('text');
            table.string('type');
            table.timestamps(true, true);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
        .dropTableIfExists('appeal')
        .dropTableIfExists('mailing')
        .dropTableIfExists('messages')
        .dropTableIfExists('news')
        .dropTableIfExists('users')
        .dropTableIfExists('departments')
        .dropTableIfExists('position')
        .dropTableIfExists('organizations');
};
