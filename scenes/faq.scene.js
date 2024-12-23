const { Scenes, Markup } = require('telegraf');
const FAQ = require('../models/FAQ');

class FAQScene {
    constructor() {
        const scene = new Scenes.BaseScene('FAQ_SCENE');

        scene.enter(this.showCategories.bind(this));
        scene.action('back_to_menu', ctx => ctx.scene.enter('MAIN_MENU_SCENE'));
        scene.action('back_to_categories', this.showCategories.bind(this));
        scene.action(/category_(.+)/, this.showQuestions.bind(this));
        scene.action(/question_(\d+)/, this.showAnswer.bind(this));

        return scene;
    }

    async showCategories(ctx) {
        try {
            // Get all FAQs and extract unique categories
            const faqs = await FAQ.getAll();
            const categories = [...new Set(faqs.map(faq => faq.category))].filter(Boolean);

            if (!categories.length) {
                await ctx.reply('В базе пока нет вопросов и ответов.');
                return ctx.scene.enter('MAIN_MENU_SCENE');
            }

            // Store FAQs in session for later use
            ctx.session.faq = {
                allFaqs: faqs,
                categories: categories
            };

            const keyboard = [
                ...categories.map(category => ([
                    Markup.button.callback(`📁 ${category}`, `category_${category}`)
                ])),
                [Markup.button.callback('⬅️ В главное меню', 'back_to_menu')]
            ];

            await ctx.reply(
                'Выберите категорию вопросов:',
                Markup.inlineKeyboard(keyboard)
            );

        } catch (error) {
            console.error('Show FAQ categories error:', error);
            await ctx.reply('Произошла ошибка при загрузке категорий');
            await ctx.scene.enter('MAIN_MENU_SCENE');
        }
    }

    async showQuestions(ctx) {
        try {
            const category = ctx.match[1];
            
            // Filter FAQs by selected category
            const categoryFaqs = ctx.session.faq.allFaqs.filter(
                faq => faq.category === category
            );

            if (!categoryFaqs.length) {
                await ctx.reply('В данной категории нет вопросов');
                return this.showCategories(ctx);
            }

            const keyboard = [
                ...categoryFaqs.map(faq => ([
                    Markup.button.callback(
                        `❓ ${faq.question.substring(0, 60)}${faq.question.length > 60 ? '...' : ''}`,
                        `question_${faq.id}`
                    )
                ])),
                [Markup.button.callback('⬅️ К категориям', 'back_to_categories')]
            ];

            await ctx.reply(
                `Вопросы в категории "${category}":`,
                Markup.inlineKeyboard(keyboard)
            );

        } catch (error) {
            console.error('Show category questions error:', error);
            await ctx.reply('Произошла ошибка при загрузке вопросов');
            await this.showCategories(ctx);
        }
    }

    async showAnswer(ctx) {
        try {
            const faqId = parseInt(ctx.match[1]);
            const faq = ctx.session.faq.allFaqs.find(f => f.id === faqId);

            if (!faq) {
                await ctx.reply('Вопрос не найден');
                return this.showCategories(ctx);
            }

            const keyboard = Markup.inlineKeyboard([
                [Markup.button.callback('⬅️ К вопросам', `category_${faq.category}`)],
                [Markup.button.callback('⬅️ К категориям', 'back_to_categories')]
            ]);

            const message = `❓ Вопрос: ${faq.question}\n\n💡 Ответ: ${faq.answer}`;

            await ctx.reply(message, keyboard);

        } catch (error) {
            console.error('Show answer error:', error);
            await ctx.reply('Произошла ошибка при загрузке ответа');
            await this.showCategories(ctx);
        }
    }
}

module.exports = FAQScene;