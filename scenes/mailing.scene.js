const { Scenes, Markup } = require('telegraf');
const User = require('../models/User');

class MailingScene {
    constructor() {
        const scene = new Scenes.BaseScene('MAILING_SCENE');
        
        scene.enter(this.showMenu.bind(this));
        scene.action('filter', this.showFilterPrompt.bind(this));
        scene.action('everyone', this.showMessagePrompt.bind(this));
        scene.action('back', ctx => ctx.scene.enter('ADMIN_MENU_SCENE'));
        scene.action('filter', this.showMailingList.bind(this));
        scene.action('more_mailings', this.showNextMailingsPage.bind(this));
        scene.action(/mailing_(\d+)/, this.handleMailingSelect.bind(this));
        scene.on('text', this.handleMessage.bind(this));

        return scene;
    }

    async showMenu(ctx) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📨 Рассылка с фильтром', 'filter')],
            [Markup.button.callback('📢 Отправить всем', 'everyone')],
            [Markup.button.callback('⬅️ Назад', 'back')]
        ]);

        await ctx.reply('Выберите тип рассылки:', keyboard);
    }

    async showFilterPrompt(ctx) {
        ctx.session.mailing = { useFilter: true };
        await ctx.reply('Отправьте сообщение для рассылки с применением фильтров');
    }

    async showMessagePrompt(ctx) {
        ctx.session.mailing = { useFilter: false };
        await ctx.reply('Отправьте сообщение для рассылки всем пользователям');
    }

    async showMailingList(ctx, page = 0) {
        try {
            const mailings = await Mailing.getAll();
            ctx.session.mailings = {
                list: mailings,
                currentPage: page
            };

            const keyboard = this.buildMailingsKeyboard(mailings, page);
            await ctx.reply('Выберите рассылку:', keyboard);
        } catch (error) {
            console.error('Get mailings error:', error);
            await ctx.reply('Не удалось получить данные!');
            return ctx.scene.reenter();
        }
    }

    buildMailingsKeyboard(mailings, page) {
        const buttons = mailings
            .slice(page * MAILINGS_PER_PAGE, (page + 1) * MAILINGS_PER_PAGE)
            .map(mailing => [
                Markup.button.callback(mailing.name, `mailing_${mailing.id}`)
            ]);

        if (mailings.length > (page + 1) * MAILINGS_PER_PAGE) {
            buttons.push([Markup.button.callback('➡️ Ещё', 'more_mailings')]);
        }

        buttons.push([Markup.button.callback('⬅️ Назад', 'back')]);

        return Markup.inlineKeyboard(buttons);
    }

    async showNextMailingsPage(ctx) {
        const nextPage = ctx.session.mailings.currentPage + 1;
        await ctx.editMessageReplyMarkup(
            this.buildMailingsKeyboard(ctx.session.mailings.list, nextPage).reply_markup
        );
        ctx.session.mailings.currentPage = nextPage;
    }

    async handleMailingSelect(ctx) {
        const mailingId = parseInt(ctx.match[1]);
        ctx.session.mailing = { 
            useFilter: true,
            selectedMailing: mailingId 
        };
        await ctx.reply('Отправьте сообщение для рассылки');
    }

    async handleMessage(ctx) {
        if (!ctx.session.mailing) {
            return ctx.scene.reenter();
        }
    
        try {
            const users = ctx.session.mailing.useFilter
                ? await User.getUsersWithFilter(ctx.session.filters || {})
                : await User.getAll();
    
            const stats = {
                total: users.length,
                success: 0,
                blocked: 0,
                noChat: 0
            };
    
            for (const user of users) {
                if (!user.tgchat) {
                    stats.noChat++;
                    continue;
                }
    
                try {
                    await ctx.telegram.copyMessage(user.tgchat, ctx.chat.id, ctx.message.message_id);
                    stats.success++;
                } catch (error) {
                    if (error.response?.error_code === 403) {
                        stats.blocked++;
                    }
                }
            }
    
            const report = `
    Рассылка завершена:
    ✅ Успешно доставлено: ${stats.success}
    ❌ Заблокировали бота: ${stats.blocked}
    ⚠️ Нет чата: ${stats.noChat}
    📊 Всего пользователей: ${stats.total}
            `.trim();
    
            await ctx.reply(report);
            return ctx.scene.enter('ADMIN_MENU_SCENE');
    
        } catch (error) {
            console.error('Mailing error:', error);
            await ctx.reply('Ошибка при выполнении рассылки');
        }
    }    
}

module.exports = MailingScene;
