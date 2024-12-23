const { Scenes, Markup } = require('telegraf');

class MainMenuScene {
    constructor() {
        this.keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🏢 Знакомство с Группой компаний «Римера»', '_')],
            [Markup.button.callback('📰 Дайджест новостей', '_')],
            [Markup.button.callback('💡 Подать рацпредложение', 'appeal_feature')],
            [Markup.button.callback('⚠️ Сообщить о проблеме', 'appeal_problem')],
            [Markup.button.callback('✍️ Предложить новость', 'news')],
            [Markup.button.callback('📞 Контакты', 'appeal_contacts')],
            [Markup.button.callback('ℹ️ Часто задаваемые вопросы', 'faq')],
            [Markup.button.callback('💼 Наши вакансии ', 'vacancies')],
            [Markup.button.callback('❓ Помощь', 'help')]
        ]);

        const scene = new Scenes.BaseScene('MAIN_MENU_SCENE');
        
        scene.enter(this.showMainMenu.bind(this));
        scene.action('news', ctx => ctx.scene.enter('ADD_NEWS_SCENE'));
        scene.action('faq', ctx => ctx.scene.enter('FAQ_SCENE'));
        scene.action('vacancies', ctx => ctx.scene.enter('VACANCY_SCENE'));
        scene.action('help', this.showHelp.bind(this));
        scene.action('appeal_feature', ctx => {
            ctx.session.direction = 'appeal_feature';
            ctx.scene.enter('APPEAL_SCENE')
        });
        scene.action('appeal_problem', ctx => {
            ctx.session.direction = 'appeal_problem';
            ctx.scene.enter('APPEAL_SCENE')
        });
        scene.action('appeal_contacts', ctx => {
            ctx.session.direction = 'appeal_contacts';
            ctx.scene.enter('APPEAL_SCENE')
        });

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
