const { Scenes, Markup } = require('telegraf');

class AdminMenuScene {
    constructor() {
        this.keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📰 Предложить новость', 'news')],
            [Markup.button.callback('📤 Опубликовать новость', 'publish_news')],
            [Markup.button.callback('📝 Обратная связь', 'feedback')],
            [Markup.button.callback('💡 Предложить идею', 'appeal')],
            [Markup.button.callback('📨 Рассылка', 'mailing')],
            [Markup.button.callback('❓ Помощь', 'help')]
        ]);

        const scene = new Scenes.BaseScene('ADMIN_MENU_SCENE');
                
        scene.enter(this.showAdminMenu.bind(this));
        scene.action('news', ctx => ctx.scene.enter('ADD_NEWS_SCENE'));
        scene.action('publish_news', ctx => ctx.scene.enter('PUBLISH_NEWS_SCENE'));
        scene.action('feedback', ctx => ctx.scene.enter('FEEDBACK_SCENE'));
        scene.action('appeal', ctx => ctx.scene.enter('APPEAL_SCENE'));
        scene.action('mailing', ctx => ctx.scene.enter('MAILING_SCENE'));
        scene.action('help', this.showHelp.bind(this));

        return scene;
    }

    async showAdminMenu(ctx) {
        await ctx.reply(
            `Панель администратора\nВыберите нужный раздел:`,
            this.keyboard
        );
    }

    async showHelp(ctx) {
        const helpText = `
📱 Помощь по использованию админ-панели:

/start - Перезапуск бота
📰 Новости - Управление новостями
📝 Обратная связь - Просмотр отзывов
💡 Предложить идею - Просмотр предложений
📨 Рассылка - Управление рассылками

По техническим вопросам обращайтесь к разработчикам.
        `.trim();

        await ctx.reply(helpText, this.keyboard);
    }
}

module.exports = AdminMenuScene;
