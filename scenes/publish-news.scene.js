const { Scenes, Markup } = require('telegraf');
const News = require('../models/News');

const TG_CHANNELS = [
    { id: '@channel1', name: 'Channel 1' },
    { id: '@channel2', name: 'Channel 2' },
    { id: '@channel3', name: 'Channel 3' }
];

class PublishNewsScene {
    constructor() {
        const scene = new Scenes.BaseScene('PUBLISH_NEWS_SCENE');
        
        scene.enter(this.showMenu.bind(this));
        scene.action('next_news', this.showNextNews.bind(this));
        scene.action('select_news', this.selectCurrentNews.bind(this));
        scene.action('publish', this.publishNews.bind(this));
        scene.action('back', ctx => ctx.scene.enter('ADMIN_MENU_SCENE'));
        scene.action(/channel_(.+)/, this.toggleChannel.bind(this));

        return scene;
    }

    async showMenu(ctx) {
        ctx.session.publishNews = {
            currentNews: null,
            selectedNews: null,
            selectedChannels: []
        };

        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📰 Следующая новость', 'next_news')],
            [Markup.button.callback('⬅️ Назад', 'back')]
        ]);

        await ctx.reply('Управление публикацией новостей:', keyboard);
    }

    async showNextNews(ctx) {
        try {
            const inbox = await News.getInbox();
            
            if (!inbox.length) {
                return ctx.reply('Нет новостей для публикации');
            }

            if (!ctx.session.publishNews.currentNews) {
                ctx.session.publishNews.currentNews = 0;
            } else {
                ctx.session.publishNews.currentNews = 
                    (ctx.session.publishNews.currentNews + 1) % inbox.length;
            }

            const news = inbox[ctx.session.publishNews.currentNews];
            
            const keyboard = Markup.inlineKeyboard([
                [Markup.button.callback('✅ Выбрать новость', 'select_news')],
                [Markup.button.callback('📰 Следующая новость', 'next_news')],
                [Markup.button.callback('⬅️ Назад', 'back')]
            ]);

            let message = `📰 ${news.text}\n\nАвтор: @${news.username || 'неизвестен'}`;
            
            if (news.files?.length) {
                await ctx.replyWithMediaGroup(news.files);
            }
            
            await ctx.reply(message, keyboard);

        } catch (error) {
            console.error('Show news error:', error);
            await ctx.reply('Ошибка при загрузке новостей');
        }
    }

    async selectCurrentNews(ctx) {
        const inbox = await News.getInbox();
        ctx.session.publishNews.selectedNews = inbox[ctx.session.publishNews.currentNews];

        const keyboard = Markup.inlineKeyboard([
            ...TG_CHANNELS.map(channel => [
                Markup.button.callback(
                    `${ctx.session.publishNews.selectedChannels.includes(channel.id) ? '✅' : '⬜️'} ${channel.name}`,
                    `channel_${channel.id}`
                )
            ]),
            [Markup.button.callback('📤 Опубликовать', 'publish')],
            [Markup.button.callback('⬅️ Назад', 'back')]
        ]);

        await ctx.reply('Выберите каналы для публикации:', keyboard);
    }

    async toggleChannel(ctx) {
        const channelId = ctx.match[1];
        const index = ctx.session.publishNews.selectedChannels.indexOf(channelId);
        
        if (index === -1) {
            ctx.session.publishNews.selectedChannels.push(channelId);
        } else {
            ctx.session.publishNews.selectedChannels.splice(index, 1);
        }

        const keyboard = Markup.inlineKeyboard([
            ...TG_CHANNELS.map(channel => [
                Markup.button.callback(
                    `${ctx.session.publishNews.selectedChannels.includes(channel.id) ? '✅' : '⬜️'} ${channel.name}`,
                    `channel_${channel.id}`
                )
            ]),
            [Markup.button.callback('📤 Опубликовать', 'publish')],
            [Markup.button.callback('⬅️ Назад', 'back')]
        ]);

        await ctx.editMessageReplyMarkup(keyboard.reply_markup);
    }

    async publishNews(ctx) {
        if (!ctx.session.publishNews.selectedNews) {
            return ctx.reply('Сначала выберите новость');
        }

        if (!ctx.session.publishNews.selectedChannels.length) {
            return ctx.reply('Выберите хотя бы один канал');
        }

        try {
            const news = ctx.session.publishNews.selectedNews;
            
            for (const channelId of ctx.session.publishNews.selectedChannels) {
                let message = `📰 ${news.text}`;
                
                if (news.files?.length) {
                    await ctx.telegram.sendMediaGroup(channelId, news.files);
                } else {
                    await ctx.telegram.sendMessage(channelId, message);
                }
            }

            await ctx.reply('Новость успешно опубликована!');
            return ctx.scene.enter('ADMIN_MENU_SCENE');

        } catch (error) {
            console.error('Publish news error:', error);
            await ctx.reply('Ошибка при публикации новости');
        }
    }
}

module.exports = PublishNewsScene;
