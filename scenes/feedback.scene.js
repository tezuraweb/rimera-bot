const { Scenes, Markup } = require('telegraf');
const Appeal = require('../models/Appeal');
const Email = require('../models/Email');
const User = require('../models/User');
const AppealFiles = require('../models/AppealFiles');
const { sendMessage } = require('../utils/bot-message');

const types = {
    appeal_feature: 'Предложение по улучшению',
    appeal_problem: 'Сообщение о проблеме',
    appeal_security: 'Вопрос по безопасности',
    appeal_ceo: 'Обращение к руководству',
    appeal_hr: 'Вопрос по трудоустройству',
    appeal_labour: 'Вопрос по охране труда'
};

class FeedbackScene {
    constructor() {
        const scene = new Scenes.BaseScene('FEEDBACK_SCENE');

        scene.enter(this.initSession.bind(this));
        scene.action('next_appeal', this.showNextAppeal.bind(this));
        scene.action('select_appeal', this.selectCurrentAppeal.bind(this));
        scene.action('send_feedback', this.sendFeedback.bind(this));
        scene.action('back', ctx => ctx.scene.enter('ADMIN_MENU_SCENE'));
        scene.on('text', this.handleFeedbackText.bind(this));

        return scene;
    }

    async initSession(ctx) {
        try {
            const userEmails = await Email.getByUser(ctx.session.user.id);
            const uniqueOrganizations = [...new Set(userEmails.map(email => email.organization))];
            const uniqueTypes = [...new Set(userEmails.map(email => email.type))];

            const appeals = await Appeal.getByOrgAndType(uniqueOrganizations, uniqueTypes);

            ctx.session.feedback = {
                currentAppeal: null,
                selectedAppeal: null,
                appeals: appeals
            };

            const keyboard = Markup.inlineKeyboard([
                [Markup.button.callback('📝 Показать обращения', 'next_appeal')],
                [Markup.button.callback('⬅️ Назад', 'back')]
            ]);

            await ctx.reply('Управление обратной связью:', keyboard);
        } catch (error) {
            console.error('Init feedback session error:', error);
            await ctx.reply('Ошибка при инициализации сессии');
            await ctx.scene.enter('ADMIN_MENU_SCENE');
        }
    }

    async showNextAppeal(ctx) {
        try {
            if (!ctx.session.feedback.appeals?.length) {
                return ctx.reply('Нет обращений для обработки');
            }

            if (ctx.session.feedback.currentAppeal === null ||
                ctx.session.feedback.currentAppeal === undefined) {
                ctx.session.feedback.currentAppeal = 0;
            } else {
                ctx.session.feedback.currentAppeal++;
            }

            // Reset to beginning if we've reached the end
            if (ctx.session.feedback.currentAppeal >= ctx.session.feedback.appeals.length) {
                ctx.session.feedback.currentAppeal = 0;
            }

            const appeal = ctx.session.feedback.appeals[ctx.session.feedback.currentAppeal];

            const keyboard = Markup.inlineKeyboard([
                [Markup.button.callback('✅ Выбрать обращение', 'select_appeal')],
                [Markup.button.callback('📝 Следующее обращение', 'next_appeal')],
                [Markup.button.callback('⬅️ Назад', 'back')]
            ]);

            const creator = await User.getUserById(appeal.creator);
            let message = `📝 Обращение:\n\n${appeal.text}\n\n`;
            message += `Тип: ${types[appeal.type] || ''}\n`;
            message += `Автор: ${creator ? creator.name : 'неизвестен'}`;

            let files = [];
            try {
                files = await AppealFiles.getFilesByAppeal(appeal.id);
            } catch (error) {
                console.error('Error fetching files:', error);
                files = [];
            }

            await sendMessage(ctx, {
                text: message,
                files: files || [],
                keyboard: keyboard
            });
        } catch (error) {
            console.error('Show appeal error:', error);
            await ctx.reply('Ошибка при загрузке обращения');
        }
    }

    async selectCurrentAppeal(ctx) {
        ctx.session.feedback.selectedAppeal =
            ctx.session.feedback.appeals[ctx.session.feedback.currentAppeal];

        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Назад', 'back')]
        ]);

        await ctx.reply('Выбрано обращение для ответа. Напишите ваш ответ в следующем сообщении:', keyboard);
    }

    async handleFeedbackText(ctx) {
        ctx.session.feedback.replyText = ctx.message.text;

        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('✅ Подтвердить отправку', 'send_feedback')],
            [Markup.button.callback('⬅️ Назад', 'back')]
        ]);

        await ctx.reply('Подтвердите отправку ответа:', keyboard);
    }

    async sendFeedback(ctx) {
        if (!ctx.session.feedback.selectedAppeal) {
            return ctx.reply('Сначала выберите обращение');
        }

        if (!ctx.session.feedback.replyText) {
            return ctx.reply('Необходимо написать текст ответа');
        }

        try {
            const appeal = ctx.session.feedback.selectedAppeal;

            const creator = await User.getUserById(appeal.creator);

            if (!creator || !creator.tgchat) {
                return ctx.reply('Не удалось найти контакт автора обращения');
            }

            try {
                const text = `🔔 Ответ на ваше обращение:\n${ctx.session.feedback.selectedAppeal.text.slice(0, 100)}${ctx.session.feedback.selectedAppeal.text.length >= 100 ? '...' : ''}\n\n 🗣️${ctx.session.feedback.replyText}`;

                await sendMessage(ctx.telegram, {
                    text: text,
                    chatId: creator.tgchat
                });

                await ctx.reply('✅ Ответ успешно отправлен автору обращения');

                await Appeal.updateResponded(appeal.id);

            } catch (error) {
                console.error('Send feedback error:', error);
                await ctx.reply('❌ Ошибка при отправке ответа');
            }

            return ctx.scene.enter('ADMIN_MENU_SCENE');

        } catch (error) {
            console.error('Send feedback error:', error);
            await ctx.reply('Ошибка при обработке ответа');
        }
    }
}

module.exports = FeedbackScene;