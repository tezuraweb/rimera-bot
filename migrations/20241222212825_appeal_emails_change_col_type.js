/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    // First create the enum type
    await knex.raw(`
        CREATE TYPE appeal_type AS ENUM (
            'appeal_feature',
            'appeal_problem',
            'appeal_security',
            'appeal_ceo',
            'appeal_hr',
            'appeal_labour'
        );
    `);

    // Update existing values to valid enum values
    await knex.raw(`
        UPDATE appeal 
        SET type = 'appeal_problem'
        WHERE type NOT IN (
            'appeal_feature',
            'appeal_problem',
            'appeal_security',
            'appeal_ceo',
            'appeal_hr',
            'appeal_labour'
        ) OR type IS NULL;
    `);

    // Convert the column type
    await knex.raw(`
        ALTER TABLE appeal 
        ALTER COLUMN type TYPE appeal_type 
        USING type::appeal_type;
    `);

    // Set not null constraint after conversion
    await knex.raw(`
        ALTER TABLE appeal
        ALTER COLUMN type SET NOT NULL;
    `);

    // Repeat the same process for emails table
    await knex.raw(`
        UPDATE emails 
        SET type = 'appeal_problem'
        WHERE type NOT IN (
            'appeal_feature',
            'appeal_problem',
            'appeal_security',
            'appeal_ceo',
            'appeal_hr',
            'appeal_labour'
        ) OR type IS NULL;
    `);

    await knex.raw(`
        ALTER TABLE emails
        ALTER COLUMN type TYPE appeal_type
        USING type::appeal_type;
    `);

    await knex.raw(`
        ALTER TABLE emails
        ALTER COLUMN type SET NOT NULL;
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    // Convert columns back to string type
    await knex.raw(`
        ALTER TABLE appeal
        ALTER COLUMN type TYPE VARCHAR
        USING type::text;
    `);

    await knex.raw(`
        ALTER TABLE emails
        ALTER COLUMN type TYPE VARCHAR
        USING type::text;
    `);

    // Drop the enum type
    await knex.raw(`DROP TYPE appeal_type;`);
};