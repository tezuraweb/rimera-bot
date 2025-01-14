const { Scenes, Markup } = require('telegraf');
const { sendMessage } = require('../utils/bot-message');

class MainMenuScene {
    constructor() {
        this.keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🏢 Знакомство с Группой компаний «Римера»', 'goto_info')],
            [Markup.button.callback('📰 Дайджест новостей', 'goto_digest')],
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
        scene.action('goto_info', ctx => ctx.scene.enter('INFO_SCENE'));
        scene.action('goto_digest', this.showDigest.bind(this));
        scene.action('digest_course', this.showDigestCourse.bind(this));
        scene.action('vacancies', this.showVacancies.bind(this));
        scene.action('back', ctx => ctx.scene.reenter());
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

    async showDigest(ctx) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('Курс Римера', 'digest_course')],
            [Markup.button.url(
                'Новостной дайджест «Click&Read»',
                'https://news.hprspace.com/'
            )],
            [Markup.button.callback('Назад', 'back')],
        ]);

        await sendMessage(ctx, { 
            messageName: 'news_digest',
            keyboard 
        });
    }

    async showDigestCourse(ctx) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('Назад', 'back')],
        ]);

        await sendMessage(ctx, { 
            messageName: 'news_course',
            keyboard 
        });
    }

    async showVacancies(ctx) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.url(
                'Наши вакансии',
                'https://rimera.ru/career/open-positions/'
            )],
            [Markup.button.callback('Назад', 'back')],
        ]);

        await sendMessage(ctx, { 
            messageName: 'vacancies_intro',
            keyboard 
        });
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
