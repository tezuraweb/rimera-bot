const { Scenes, Markup } = require('telegraf');
const Channel = require('../models/Channel');
const Auth = require('../models/Auth');
const { sendMessage } = require('../utils/bot-message');

class GreetingScene {
    constructor() {
        const scene = new Scenes.BaseScene('GREETING_SCENE');

        scene.enter(this.initSession.bind(this));
        scene.action(/channel_\d+/, this.handleChannelClick.bind(this));
        scene.action('check_subscription', this.checkSubscription.bind(this));

        return scene;
    }

    async initSession(ctx) {
        try {
            const channels = await Channel.getAll();

            ctx.session.greetingScene = {
                channels: channels,
            };

            return this.showSubscriptionMessage(ctx);
        } catch (error) {
            console.error('Error initializing greeting scene:', error);
            await ctx.reply('Произошла ошибка. Попробуйте позже.');
        }
    }

    async showSubscriptionMessage(ctx) {
        try {
            const nonSubscribedChannels = await this.getNonSubscribedChannels(ctx);

            if (nonSubscribedChannels.length === 0) {
                await Auth.updateSubscription(ctx.session.user.id, true);
                await sendMessage(ctx, { messageName: 'greeting_goto_menu' });
                return ctx.scene.enter('MAIN_MENU_SCENE');
            }

            const keyboard = Markup.inlineKeyboard([
                ...nonSubscribedChannels.map(channel => [
                    Markup.button.url(
                        `⬜️ ${channel.name} (@${channel.link})`,
                        `https://t.me/${channel.link}`
                    )
                ]),
                [Markup.button.callback('Я подписался!', 'check_subscription')]
            ]);

            await sendMessage(ctx, { messageName: 'greeting_subscribe', keyboard });
        } catch (error) {
            console.error('Error showing subscription message:', error);
            await ctx.reply('Произошла ошибка. Попробуйте позже.');
        }
    }

    async getNonSubscribedChannels(ctx) {
        const nonSubscribedChannels = [];

        for (const channel of ctx.session.greetingScene.channels) {
            try {
                const member = await ctx.telegram.getChatMember(`@${channel.link}`, ctx.from.id);
                if (!['member', 'administrator', 'creator'].includes(member.status)) {
                    nonSubscribedChannels.push(channel);
                }
            } catch (error) {
                console.error(`Error checking channel ${channel.link}:`, error);
            }
        }

        return nonSubscribedChannels;
    }

    async handleChannelClick(ctx) {
        // This is triggered when user clicks channel button
        // But since we're using URL buttons now, this won't be called
        // Keeping it for potential future modifications
        await ctx.answerCbQuery();
    }

    async checkSubscription(ctx) {
        try {
            const nonSubscribedChannels = await this.getNonSubscribedChannels(ctx);
            let gotoMenu = false, message = {}, keyboard = null;

            if (nonSubscribedChannels.length === 0) {
                gotoMenu = true;
                await Auth.updateSubscription(ctx.session.user.id, true);
            }

            if (gotoMenu) {
                await sendMessage(ctx, { messageName: 'greeting_goto_menu' });
                await ctx.scene.enter('MAIN_MENU_SCENE');
            } else {
                keyboard = Markup.inlineKeyboard([
                    ...nonSubscribedChannels.map(channel => [
                        Markup.button.url(
                            `⬜️ ${channel.name} (@${channel.link})`,
                            `https://t.me/${channel.link}`
                        )
                    ]),
                    [Markup.button.callback('Я подписался!', 'check_subscription')]
                ]);

                await sendMessage(ctx, { messageName: 'greeting_deny', keyboard });
            }
        } catch (error) {
            console.error('Error checking subscription:', error);
            await ctx.reply('Произошла ошибка при проверке подписок. Попробуйте позже.');
        }
    }
}

module.exports = GreetingScene;