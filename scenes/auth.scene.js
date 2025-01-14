const { Scenes, Markup } = require('telegraf');
const User = require('../models/User');
const Auth = require('../models/Auth');
const { sendMessage } = require('../utils/bot-message');

class AuthScene {
    constructor() {
        const scene = new Scenes.BaseScene('AUTH_SCENE');
        
        scene.enter(async (ctx) => {
            await sendMessage(ctx, { messageName: 'greeting_welcome' });
            await sendMessage(ctx, { messageName: 'greeting_info' });

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

    async requestCredentials(ctx) {
        await sendMessage(ctx, { messageName: 'greeting_request_phone' });
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
                await sendMessage(ctx, { messageName: 'greeting_not_found' });
                return;
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

            const authRecord = await Auth.getByUserId(updatedUser.id);

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
                const newAuthRecord = await Auth.create(updatedUser.id);

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