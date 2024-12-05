const { Scenes, Markup } = require('telegraf');

class MainMenuScene {
    constructor() {
        this.keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📰 Новости', 'news')],
            [Markup.button.callback('📝 Обратная связь', 'feedback')],
            [Markup.button.callback('💡 Предложить идею', 'appeal')],
            [Markup.button.callback('❓ Помощь', 'help')]
        ]);

        const scene = new Scenes.BaseScene('MAIN_MENU_SCENE');
        
        scene.enter(this.showMainMenu.bind(this));
        scene.action('news', ctx => ctx.scene.enter('ADD_NEWS_SCENE'));
        scene.action('feedback', ctx => ctx.scene.enter('FEEDBACK_SCENE'));
        scene.action('appeal', ctx => ctx.scene.enter('APPEAL_SCENE'));
        scene.action('help', this.showHelp.bind(this));

        return scene;
    }

    async showMainMenu(ctx) {
        await ctx.reply(
            `Главное меню\nВыберите нужный раздел:`,
            this.keyboard
        );
    }

    async showHelp(ctx) {
        const helpText = `
📱 Помощь по использованию бота:

/start - Перезапуск бота
📰 Новости - Последние новости компании
📝 Обратная связь - Оставить отзыв
💡 Предложить идею - Предложить улучшение

По всем вопросам обращайтесь в тех. поддержку.
        `.trim();

        await ctx.reply(helpText, this.keyboard);
    }
}

module.exports = MainMenuScene;
