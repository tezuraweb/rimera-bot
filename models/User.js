const database = require('../database');

class User {
    constructor() {
        this.db = database;
        this.tableName = "users";
    }

    getUser(chatId) {
        return this.db.select('id', 'name', 'status')
            .from(this.tableName)
            .where({ tgchat: chatId })
            .then((data) => data[0]);
    }

    getUserById(id) {
        return this.db.select('id', 'tgchat', 'name', 'tgid', 'status')
            .from(this.tableName)
            .where({ id })
            .then((data) => data[0]);
    }

    getUsersByIds(ids) {
        return this.db.select('id', 'tgchat', 'name', 'status')
            .from(this.tableName)
            .whereNotNull('tgchat')
            .whereIn('id', ids);
    }

    getAll() {
        return this.db.select('id', 'tgchat', 'name', 'tgid')
            .from(this.tableName)
            .whereNotNull('tgchat');
    }

    getByIds(ids) {
        return this.db.select('id', 'name', 'tgid')
            .from(this.tableName)
            .whereNotNull('tgchat')
            .whereIn('id', ids);
    }

    getUserByDuty(duty) {
        return this.db.select('id', 'tgchat', 'name', 'tgid', 'status')
            .from(this.tableName)
            .where({ duty })
            .then((data) => data[0]);
    }

    searchAll(query) {
        return this.db.select('id', 'name', 'tgid')
            .from(this.tableName)
            .whereNotNull('tgchat')
            .whereILike('name', `%${query}%`)
            .orWhereILike('tgid', `%${query}%`);
    }

    getStats() {
        return this.db.select('users.status', 'organizations.name')
            .from(this.tableName)
            .join('organizations', 'users.organization', '=', 'organizations.id')
            .count('* as total_count')
            .select(this.db.raw('SUM(CASE WHEN "tgchat" IS NOT NULL THEN 1 ELSE 0 END) as tgchat_count'))
            .groupBy('status', 'organizations.name')
            .then(data => {
                let dataDict = data.reduce((acc, curr) => {
                    if (curr.status == 'admin') {
                        acc.admin_total += parseInt(curr.total_count);
                        acc.admin_tgchat += parseInt(curr.tgchat_count);
                    } else {
                        acc.common_total += parseInt(curr.total_count);
                        acc.common_tgchat += parseInt(curr.tgchat_count);
                        acc.common_list.push(curr);
                    }

                    return acc;
                }, {
                    admin_total: 0,
                    admin_tgchat: 0,
                    common_total: 0,
                    common_tgchat: 0,
                    common_list: [],
                })

                return dataDict;
            })
    }

    getUsersWithFilter(filter) {
        return this.db.select('id', 'tgchat')
            .from(this.tableName)
            .whereNotNull('tgchat')
            .modify((queryBuilder) => {
                if (filter.organization !== null && filter.organization.length > 0) {
                    queryBuilder.whereIn('organization', filter.organization);
                }
                if (filter.department !== null && filter.department.length > 0) {
                    queryBuilder.whereIn('department', filter.department);
                }
                if (filter.position !== null && filter.position.length > 0) {
                    if (filter.position.length == 1) {
                        queryBuilder.whereIn('position', this.db.raw('SELECT id FROM position WHERE category = ?', [filter.position[0]]));
                    }
                }
                if (filter.gender !== null && filter.gender.length > 0) {
                    queryBuilder.where({ 'gender': filter.gender[0] });
                }
            });
    }

    getByNumber(number) {
        return this.db.select('id', 'name', 'status', 'phone')
            .from(this.tableName)
            .modify((queryBuilder) => {
                if (number.length >= 10 && number.length <= 12) {
                    if (number.length == 10) {
                        queryBuilder.whereILike('phone', `%${number}`);
                    } else if (number.length == 11) {
                        queryBuilder.whereILike('phone', `%${number.slice(1)}`);
                    } else {
                        queryBuilder.whereILike('phone', `%${number.slice(2)}`);
                    }
                } else {
                    queryBuilder.where({ 'user_outer_id': number });
                }
            })
            .then((data) => data[0]);
    }

    signIn(id, chatId, username) {
        return this.db(this.tableName).update({
            'tgid': username,
            'tgchat': chatId,
            // 'auth_phone': authPhone
        })
            .where({ id })
            .returning('id', 'name', 'status', 'phone')
            .then((data) => data[0]);
    }

    backofficeCheck(number) {
        return this.db.select('id', 'name', 'status', 'password')
            .from(this.tableName)
            .modify((queryBuilder) => {
                if (number.length >= 10 && number.length <= 12) {
                    if (number.length == 10) {
                        queryBuilder.whereILike('phone', `%${number}`);
                    } else if (number.length == 11) {
                        queryBuilder.whereILike('phone', `%${number.slice(1)}`);
                    } else {
                        queryBuilder.whereILike('phone', `%${number.slice(2)}`);
                    }
                } else {
                    queryBuilder.where({ 'user_outer_id': number });
                }
            })
            .then((data) => data[0]);
    }

    backofficeSignUp(id, password) {
        return this.db(this.tableName).update({
            'password': password
        })
            .where({ id })
            .returning('name')
            .then((data) => data[0]);
    }

    getShift(data) {
        try {
            const { shift, timetable, timetable_type } = data;
            console.log(shift, timetable, timetable_type);
            // if (shift == 'first') {
            const query = `
                    SELECT
                        departure_time AS fromPark,
                        mg_start_time AS start,
                        start_trmnl AS startTrmnl,
                        shift_start AS toPark,
                        name_trmnl_one AS finishTrmnl,
                        shift_end AS finish,
                        SEC_TO_TIME(
                            TIME_TO_SEC(shift_start) -
                            TIME_TO_SEC(mg_start_time) -
                            COALESCE(TIME_TO_SEC(first_lunch_time), 0) -
                            COALESCE(TIME_TO_SEC(second_lunch_time), 0)
                        ) AS onroute
                    FROM
                        schedules
                    WHERE
                        mg_start_time IS NOT NULL
                        AND timetable = ?
                        AND timetable_type = ?;
                `;

            // return this.db.raw(query, [timetable, timetable_type]).then((res) => { console.log(res[0]); return res[0] });

            this.db.select(
                    'departure_time as fromPark',
                    'mg_start_time as start',
                    'start_trmnl as startTrmnl',
                    'shift_start as toPark',
                    'name_trmnl_one as finishTrmnl',
                    'shift_end as finish',
                    this.db.raw(`
                        SEC_TO_TIME(
                            TIME_TO_SEC(shift_start) -
                            TIME_TO_SEC(mg_start_time) -
                            COALESCE(TIME_TO_SEC(first_lunch_time), 0) -
                            COALESCE(TIME_TO_SEC(second_lunch_time), 0)
                        ) AS onroute
                    `)
                )
                .from(this.tableName)
                .whereNotNull('mg_start_time')
                .andWhere('timetable', timetable)
                .andWhere('timetable_type', timetable_type)
                .then(res => {
                    console.log(res);
                    return res[0];
                })
                .catch(err => {
                    console.error(err);
                });

            // }
            // else if (shift == 'second') {

            // }
            // else if (shift == 'double') {

            // }
        }
        catch (error) {
            console.error(error);
        }
    }
}

module.exports = new User();