const { Scenes, Markup } = require('telegraf');
const User = require('../models/User');

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
        await ctx.reply("Добро пожаловать, " + user.name + "!");
        
        return ctx.scene.enter(user.status === 'admin' ? 'ADMIN_MENU_SCENE' : 'MAIN_MENU_SCENE');
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

            await ctx.reply(
                "Добро пожаловать, " + updatedUser.name + "!",
                Markup.removeKeyboard()
            );

            return ctx.scene.enter(updatedUser.status === 'admin' ? 'ADMIN_MENU_SCENE' : 'MAIN_MENU_SCENE');

        } catch (error) {
            console.error('Auth error:', error);
            return ctx.reply("Произошла ошибка при авторизации. Попробуйте позже.");
        }
    }
}

module.exports = AuthScene;
