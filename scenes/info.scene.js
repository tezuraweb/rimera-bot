const { Scenes, Markup } = require('telegraf');
const { sendMessage } = require('../utils/bot-message');

class InfoScene {
    constructor() {
        const scene = new Scenes.BaseScene('INFO_SCENE');

        scene.enter(this.showMainMenu.bind(this));
        scene.action('mission', this.showMission.bind(this));
        scene.action('values', this.showValues.bind(this));
        scene.action('code', this.showCode.bind(this));
        scene.action('info', this.showInfo.bind(this));
        scene.action('back', this.showMainMenu.bind(this));
        scene.action('menu', this.gotoMainMenu.bind(this));

        return scene;
    }

    async showMainMenu(ctx) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('Миссия', 'mission')],
            [Markup.button.callback('Ценности', 'values')],
            [Markup.button.callback('Кодекс делового поведения и этики', 'code')],
            [Markup.button.callback('Информация о компании', 'info')],
            [Markup.button.callback('В главное меню', 'menu')]
        ]);

        await sendMessage(ctx, { 
            messageName: 'company_intro',
            keyboard 
        });
    }

    async showMission(ctx) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('Назад', 'back')],
            [Markup.button.callback('В главное меню', 'menu')]
        ]);

        await sendMessage(ctx, { 
            messageName: 'company_mission',
            keyboard 
        });
    }

    async showValues(ctx) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('Назад', 'back')],
            [Markup.button.callback('В главное меню', 'menu')]
        ]);

        await sendMessage(ctx, { 
            messageName: 'company_values',
            keyboard 
        });
    }

    async showCode(ctx) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('Назад', 'back')],
            [Markup.button.callback('В главное меню', 'menu')]
        ]);

        await sendMessage(ctx, { 
            messageName: 'company_code',
            keyboard 
        });
    }

    async showInfo(ctx) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('Назад', 'back')],
            [Markup.button.callback('В главное меню', 'menu')]
        ]);

        await sendMessage(ctx, { 
            messageName: 'company_info',
            keyboard 
        });
    }

    async gotoMainMenu(ctx) {
        await ctx.scene.enter('MAIN_MENU_SCENE');
    }
}

module.exports = InfoScene;