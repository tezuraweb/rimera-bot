const { Telegraf } = require('telegraf');
const Config = require('../config');
const Auth = require('../models/Auth');
const Messages = require('../models/Messages');
const Channel = require('../models/Channel');
const { dateTimeNow } = require('../utils/logging');

const sendReminderMessages = async () => {
    try {
        const bot = new Telegraf(Config.TELEGRAM_TOKEN);
        
        const unsubscribedUsers = await Auth.getAllUnsubscribed();
        const channels = await Channel.getAll();

        for (const user of unsubscribedUsers) {
            if (user.counter === 0) {
                return;
            }

            try {
                const nonSubscribedChannels = [];
                for (const channel of channels) {
                    try {
                        const member = await bot.telegram.getChatMember(
                            `@${channel.link}`, 
                            user.telegram_id
                        );
                        if (!['member', 'administrator', 'creator'].includes(member.status)) {
                            nonSubscribedChannels.push(channel);
                        }
                    } catch (error) {
                        console.error(`Error checking channel ${channel.link} for user ${user.telegram_username}:`, error);
                        nonSubscribedChannels.push(channel);
                    }
                }

                if (nonSubscribedChannels.length === 0) {
                    await Auth.updateSubscription(user.user_id, true);
                    console.log(`%s User ${user.telegram_username} has subscribed to all channels`, dateTimeNow());
                    continue;
                }

                const messageName = user.counter === 2 ? 'greeting_remind1' : 'greeting_remind2';
                const message = await Messages.getByName(messageName);

                if (!message) {
                    console.error(`%s Message ${messageName} not found`, dateTimeNow());
                    continue;
                }

                if (message.news_files?.length) {
                    await bot.telegram.sendMediaGroup(
                        user.telegram_id,
                        message.news_files.map((fileId, index) => ({
                            type: 'photo',
                            media: fileId,
                            caption: index === 0 ? message.news_text : undefined
                        }))
                    );
                } else {
                    await bot.telegram.sendMessage(user.telegram_id, message.news_text);
                }

                const channelsText = nonSubscribedChannels
                    .map(channel => `• ${channel.name} (@${channel.link}): https://t.me/${channel.link}`)
                    .join('\n');

                await bot.telegram.sendMessage(
                    user.telegram_id,
                    'Для продолжения работы необходимо подписаться на каналы:\n' + channelsText
                );

                if (user.counter > 0) {
                    await Auth.updateCounter(user.user_id, user.counter - 1);
                }

                console.log(`%s Sent ${messageName} to user ${user.telegram_username}`, dateTimeNow());
            } catch (error) {
                console.error(`%s Error processing user ${user.telegram_username}:`, dateTimeNow(), error);
            }
        }
    } catch (error) {
        console.error('%s Error in sendReminderMessages:', dateTimeNow(), error);
    }
};

// Schedule the task to run daily at a specific time (e.g., 10:00 AM)
const scheduleReminders = () => {
    const TWENTY_FOUR_HOURS = 60 * 60 * 24 * 1000; // 24 hours in milliseconds
    
    const runDaily = () => {
        const now = new Date();
        const targetHour = 10; // 10:00 AM
        
        let nextRun = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            targetHour,
            0,
            0
        );
        
        // If it's already past target hour, schedule for next day
        if (now.getHours() >= targetHour) {
            nextRun.setDate(nextRun.getDate() + 1);
        }
        
        const timeUntilNextRun = nextRun.getTime() - now.getTime();
        
        // Schedule next run
        setTimeout(() => {
            sendReminderMessages();
            
            // Schedule next day's run
            setInterval(sendReminderMessages, TWENTY_FOUR_HOURS);
        }, timeUntilNextRun);
    };

    // Start the scheduling
    runDaily();
};

module.exports = {
    scheduleReminders,
    sendReminderMessages
};