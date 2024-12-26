const { Scenes, Markup } = require('telegraf');
const News = require('../models/News');
const Channel = require('../models/Channel');
const NewsChannel = require('../models/NewsChannel');
const NewsFiles = require('../models/NewsFiles');
const { sendMessage } = require('../utils/bot-message');

class PublishNewsScene {
    constructor() {
        const scene = new Scenes.BaseScene('PUBLISH_NEWS_SCENE');

        scene.enter(this.initSession.bind(this));
        scene.action('next_news', this.showNextNews.bind(this));
        scene.action('select_news', this.selectCurrentNews.bind(this));
        scene.action('publish', this.publishNews.bind(this));
        scene.action('back', ctx => ctx.scene.enter('ADMIN_MENU_SCENE'));
        scene.action(/channel_(\d+)/, this.toggleChannel.bind(this));
        scene.action('toggle_all', this.toggleAllChannels.bind(this));

        return scene;
    }

    async initSession(ctx) {
        const channels = await Channel.getAll();
        const inbox = await News.getInbox();

        ctx.session.publishNews = {
            currentNews: null,
            currentFiles: [],
            selectedNews: null,
            selectedChannels: channels.map(c => c.id),
            channels: channels,
            inbox: inbox,
            allSelected: true
        };

        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📰 Показать новости', 'next_news')],
            [Markup.button.callback('⬅️ Назад', 'back')]
        ]);

        await ctx.reply('Управление публикацией новостей:', keyboard);
    }

    buildChannelsKeyboard(channels, selectedChannels, allSelected) {
        return Markup.inlineKeyboard([
            [Markup.button.callback(
                `${allSelected ? '✅' : '⬜️'} Все каналы`,
                'toggle_all'
            )],
            ...channels.map(channel => [
                Markup.button.callback(
                    `${selectedChannels.includes(channel.id) ? '✅' : '⬜️'} ${channel.name} (@${channel.link})`,
                    `channel_${channel.id}`
                )
            ]),
            [Markup.button.callback('📤 Опубликовать', 'publish')],
            [Markup.button.callback('⬅️ Назад', 'back')]
        ]);
    }

    async showNextNews(ctx) {
        try {
            if (!ctx.session.publishNews.inbox?.length) {
                return ctx.reply('Нет новостей для публикации');
            }

            if ((ctx.session.publishNews.currentNews === null) || (ctx.session.publishNews.currentNews === undefined) || (ctx.session.publishNews.currentNews + 1 == ctx.session.publishNews.inbox?.length)) {
                ctx.session.publishNews.currentNews = 0;
            } else {
                ctx.session.publishNews.currentNews = ctx.session.publishNews.currentNews + 1;
            }

            const news = ctx.session.publishNews.inbox[ctx.session.publishNews.currentNews];

            const keyboard = Markup.inlineKeyboard([
                [Markup.button.callback('✅ Выбрать новость', 'select_news')],
                [Markup.button.callback(`${
                    (ctx.session.publishNews.currentNews == ctx.session.publishNews.inbox?.length - 1) ? 
                    '⬆️ В начало' :
                    '📰 Следующая новость' }`, 'next_news')],
                [Markup.button.callback('⬅️ Назад', 'back')]
            ]);

            let message = `📰 ${news.text}\n\nАвтор: @${news.username || 'неизвестен'}`;
            
            try {
                ctx.session.publishNews.currentFiles = await NewsFiles.getFilesByNews(news.id);
            } catch (error) {
                console.error('Error fetching files:', error);
                ctx.session.publishNews.currentFiles = [];
            }

            await sendMessage(ctx, { 
                text: message, 
                files: ctx.session.publishNews.currentFiles, 
                keyboard: keyboard
            });

        } catch (error) {
            console.error('Show news error:', error);
            await ctx.reply('Ошибка при загрузке новостей');
        }
    }

    async selectCurrentNews(ctx) {
        ctx.session.publishNews.selectedNews = ctx.session.publishNews.inbox[ctx.session.publishNews.currentNews];
        const newsChannelRelation = await NewsChannel.getEntriesByNews(ctx.session.publishNews.selectedNews.id);
        const newsChannels = newsChannelRelation.map(relation => relation.channel_id);

        if (newsChannels?.length > 0) {
            ctx.session.publishNews.selectedChannels = newsChannels;
        }

        const keyboard = this.buildChannelsKeyboard(
            ctx.session.publishNews.channels,
            ctx.session.publishNews.selectedChannels,
            ctx.session.publishNews.allSelected
        );

        await ctx.reply('Выберите каналы для публикации:', keyboard);
    }

    async toggleChannel(ctx) {
        const channelId = parseInt(ctx.match[1]);
        const index = ctx.session.publishNews.selectedChannels.indexOf(channelId);

        if (index === -1) {
            ctx.session.publishNews.selectedChannels.push(channelId);
        } else {
            ctx.session.publishNews.selectedChannels.splice(index, 1);
        }

        ctx.session.publishNews.allSelected = ctx.session.publishNews.selectedChannels.length === ctx.session.publishNews.channels.length;

        const keyboard = this.buildChannelsKeyboard(
            ctx.session.publishNews.channels,
            ctx.session.publishNews.selectedChannels
        );

        await ctx.editMessageReplyMarkup(keyboard.reply_markup);
    }

    async toggleAllChannels(ctx) {
        const newState = !ctx.session.publishNews.allSelected;
        ctx.session.publishNews.allSelected = newState;
        ctx.session.publishNews.selectedChannels = newState
            ? ctx.session.publishNews.channels.map(c => c.id)
            : [];

        const keyboard = this.buildChannelsKeyboard(
            ctx.session.publishNews.channels,
            ctx.session.publishNews.selectedChannels,
            ctx.session.publishNews.allSelected
        );

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

            if (ctx.session.publishNews.selectedChannels.length === 0) {
                await ctx.reply('Каналы не выбраны. Отправляю во все каналы.');
            } else {
                ctx.session.publishNews.channels = ctx.session.publishNews.channels.filter((channel) => ctx.session.publishNews.selectedChannels.includes(channel.id));
            }

            const stats = {
                total: ctx.session.publishNews.channels.length,
                success: 0,
                blocked: 0,
                noTelegramId: 0
            };

            for (const channel of ctx.session.publishNews.channels) {
                if (!channel.link) {
                    stats.noTelegramId++;
                    continue;
                }

                try {
                    await sendMessage(ctx.telegram, {
                        text: news.text,
                        files: ctx.session.publishNews.currentFiles,
                        chatId: `@${channel.link}`
                    });
                    stats.success++;
                } catch (error) {
                    console.log(error);
                    if (error.response?.error_code === 403) {
                        stats.blocked++;
                    }
                    else {
                        stats.noTelegramId++;
                    }
                }
            }

            const report = `
    Публикация завершена:
    ✅ Успешно отправлено: ${stats.success}
    ❌ Нет доступа к каналу: ${stats.blocked}
    ⚠️ Нет ID канала: ${stats.noTelegramId}
    📊 Всего каналов: ${stats.total}
            `.trim();

            if (stats.success > 0) {
                await News.updatePublish(ctx.session.publishNews.selectedNews.id);
            }

            await ctx.reply(report);
            return ctx.scene.enter('ADMIN_MENU_SCENE');

        } catch (error) {
            console.log('Publish news error:', error);
            await ctx.reply('Ошибка при публикации новости');
        }
    }
}

module.exports = PublishNewsScene;