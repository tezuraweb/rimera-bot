/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        // Users indexes
        .alterTable('users', table => {
            table.index('organization');
            table.index('department');
            table.index('position');
            table.index('status');
            table.index('user_outer_id');
            table.index('phone');
            table.index('duty');
            table.index('date_of_employment');
        })
        // Departments indexes
        .alterTable('departments', table => {
            table.index('parent_id');
            table.index('outer_id');
        })
        // News indexes
        .alterTable('news', table => {
            table.index('creator');
            table.index('template');
        })
        // Messages indexes
        .alterTable('messages', table => {
            table.index('group_id');
            table.index('news_id');
        })
        // Mailing indexes
        .alterTable('mailing', table => {
            table.index('status');
            table.index('sending_date');
            table.index('creator');
        })
        // Appeal indexes
        .alterTable('appeal', table => {
            table.index('creator');
            table.index('type');
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema
        .alterTable('users', table => {
            table.dropIndex(['organization', 'department', 'position', 'status',
                'user_outer_id', 'phone', 'duty', 'date_of_employment']);
        })
        .alterTable('departments', table => {
            table.dropIndex(['parent_id', 'organization_id', 'outer_id']);
        })
        .alterTable('news', table => {
            table.dropIndex(['creator', 'template']);
        })
        .alterTable('messages', table => {
            table.dropIndex(['group_id', 'news_id']);
        })
        .alterTable('mailing', table => {
            table.dropIndex(['status', 'sending_date', 'creator']);
        })
        .alterTable('appeal', table => {
            table.dropIndex(['creator', 'type']);
        });
};
