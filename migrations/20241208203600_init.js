/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // First, create temporary columns
    await knex.schema.alterTable('users', table => {
        table.string('tgchat_new');
        table.enum('gender_new', ['M', 'F']);
    });

    // Convert tgchat bigint to string and normalize gender values
    await knex.raw(`
        UPDATE users 
        SET 
            tgchat_new = tgchat::text,
            gender_new = CASE 
                WHEN LOWER(gender) = 'm' OR LOWER(gender) = 'м' THEN 'M'
                WHEN LOWER(gender) = 'f' OR LOWER(gender) = 'ж' THEN 'F'
                ELSE 'M'
            END
        WHERE tgchat IS NOT NULL OR gender IS NOT NULL
    `);

    // Drop old columns and rename new ones
    await knex.schema.alterTable('users', table => {
        table.dropColumn('tgchat');
        table.dropColumn('gender');
    });

    await knex.schema.alterTable('users', table => {
        table.renameColumn('tgchat_new', 'tgchat');
        table.renameColumn('gender_new', 'gender');
    });

    // Messages table
    await knex.schema.createTable('messages', table => {
        table.increments('id').primary();
        table.string('name', 100).notNullable();
        table.string('title', 255).notNullable();
        table.integer('group_id').notNullable();
        table.integer('news_id').unsigned().references('id').inTable('news');
        table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    // Create temporary columns
    await knex.schema.alterTable('users', table => {
        table.bigInteger('tgchat_old');
        table.string('gender_old');
    });

    // Convert data back
    await knex.raw(`
        UPDATE users 
        SET 
            tgchat_old = tgchat::bigint,
            gender_old = gender::text
        WHERE tgchat IS NOT NULL OR gender IS NOT NULL
    `);

    // Drop new columns and rename old ones back
    await knex.schema.alterTable('users', table => {
        table.dropColumn('tgchat');
        table.dropColumn('gender');
    });

    await knex.schema.alterTable('users', table => {
        table.renameColumn('tgchat_old', 'tgchat');
        table.renameColumn('gender_old', 'gender');
    });

    return knex.schema
        .dropTableIfExists('messages')
};
