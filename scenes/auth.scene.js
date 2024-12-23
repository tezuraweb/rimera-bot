const { Scenes, Markup } = require('telegraf');
const User = require('../models/User');
const Auth = require('../models/Auth');

class AuthScene {
    constructor() {
        const scene = new Scenes.BaseScene('AUTH_SCENE');
        
        scene.enter(async (ctx) => {
            const user = await User.getUser(ctx.from.id);
            
            if (!user) {
                return this.requestCredentials(ctx);
            }
            
            return this.handleExistingUser(ctx, user);
        });

        scene.command('start', (ctx) => {
            ctx.scene.reenter();
        });

        scene.on('message', this.handleUserInput.bind(this));

        return scene;
    }

    requestCredentials(ctx) {
        const keyboard = Markup.keyboard([
            [Markup.button.contactRequest('📱 Отправить номер телефона')]
        ]).resize();

        return ctx.reply(
            "Добро пожаловать! Для регистрации отправьте номер телефона или табельный номер",
            keyboard
        );
    }

    async handleExistingUser(ctx, user) {
        if (user.status === 'fired') {
            return ctx.reply("Вам отказано в доступе!");
        }

        ctx.session.user = user;

        if (user.status === 'admin') {
            await ctx.reply("Добро пожаловать, " + user.name + "!");
            return ctx.scene.enter('ADMIN_MENU_SCENE');
        }

        // Check auth table for non-admin users
        const authRecord = await Auth.getByUserId(user.id);

        if (authRecord) {
            ctx.session.auth = authRecord;
            if (authRecord.subscription) {
                await ctx.reply("Добро пожаловать, " + user.name + "!");
                return ctx.scene.enter('MAIN_MENU_SCENE');
            } else {
                return ctx.scene.enter('GREETING_SCENE');
            }
        } else {
            const newAuthRecord = await Auth.create(user.id);

            ctx.session.auth = newAuthRecord;
            return ctx.scene.enter('GREETING_SCENE');
        }
    }

    async handleUserInput(ctx) {
        try {
            const input = ctx.message.contact 
                ? ctx.message.contact.phone_number 
                : ctx.message.text.trim();

            const user = await User.getByNumber(input);

            if (!user) {
                return ctx.reply("Пользователь не найден. Попробуйте еще раз.");
            }

            if (user.status === 'fired') {
                return ctx.reply("Вам отказано в доступе!");
            }

            const updatedUser = await User.signIn(user.id, ctx.from.id, ctx.from.username);
            ctx.session.user = updatedUser;

            if (updatedUser.status === 'admin') {
                await ctx.reply(
                    "Добро пожаловать, " + updatedUser.name + "!",
                    Markup.removeKeyboard()
                );
                return ctx.scene.enter('ADMIN_MENU_SCENE');
            }

            const authRecord = await knex('auth')
                .where('user_id', updatedUser.id)
                .first();

            if (authRecord) {
                ctx.session.auth = authRecord;
                if (authRecord.subscription) {
                    await ctx.reply(
                        "Добро пожаловать, " + updatedUser.name + "!",
                        Markup.removeKeyboard()
                    );
                    return ctx.scene.enter('MAIN_MENU_SCENE');
                } else {
                    return ctx.scene.enter('GREETING_SCENE');
                }
            } else {
                const [newAuthRecord] = await knex('auth')
                    .insert({
                        user_id: updatedUser.id,
                        counter: 2,
                        subscription: false
                    })
                    .returning('*');

                ctx.session.auth = newAuthRecord;
                return ctx.scene.enter('GREETING_SCENE');
            }

        } catch (error) {
            console.error('Auth error:', error);
            return ctx.reply("Произошла ошибка при авторизации. Попробуйте позже.");
        }
    }
}

module.exports = AuthScene;