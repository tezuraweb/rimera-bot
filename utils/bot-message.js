const Messages = require('../models/Messages');
const NewsFiles = require('../models/NewsFiles');
const { dateTimeNow } = require('./logging');

const defaultValues = {
    'greeting_welcome': 'добро пожаловать!',
    'greeting_info': 'Это бот компании Римера',
    'greeting_subscribe': 'Подпишитесь на наши каналы для использования бота',
    'greeting_remind1': 'Подпишитесь на каналы!',
    'greeting_remind2': 'Подпишитесь на каналы!',
    'greeting_deny': 'Вы еще не подписались на каналы',
    'greeting_goto_menu': 'Отлично! теперь вам доступны все возможности бота',
    'appeal_feature': 'Опишите улучшение которое вы хотите внести',
    'appeal_problem': 'Опишите вашу проблему',
    'appeal_contacts': 'Наши контакты',
    'appeal_security': 'Подайте обращение к службам безопасности',
    'appeal_ceo': 'Подайте обращение к руководству',
    'appeal_hr': 'Подайте обращение к службе кадров',
    'appeal_labour': 'Подайте обращение к службе охраны труда',
    'company_intro': 'О компании Римера',
    'company_mission': 'Наша миссия',
    'company_values': 'Наши ценности',
    'company_code': 'Наш кодекс',
    'company_info': 'Информация о компании',
    'news_digest': 'Дайджест новостей',
    'news_course': 'Курс Римеры',
    'news_intro': 'Создайте новость для публикации в каналах',
    'faq_intro': 'Часто задаваемые вопросы',
    'vacancies_intro': 'Наши вакансии',
};

const sendMessage = async (ctx, options = {}) => {
    let messageData = {
        text: '',
        files: [],
        keyboard: options.keyboard || null
    };

    try {
        if (options.messageName) {
            const message = await Messages.getByName(options.messageName);
            let files = [];

            if (message) {
                try {
                    files = await NewsFiles.getFilesByNews(message.news_id);
                } catch (error) {
                    console.error('Error fetching files:', error);
                    files = [];
                }

                messageData = {
                    text: message.news_text,
                    files: files || [],
                    keyboard: options.keyboard
                };
            } else {
                console.warn(`${dateTimeNow()} Message "${options.messageName}" not found in database`);
                messageData.text = defaultValues[options.messageName] || 'Сообщение не найдено';
            }
        } else {
            messageData = {
                text: options.text || '',
                files: options.files || [],
                keyboard: options.keyboard
            };
        }

        if (messageData.files?.length) {
            const fileGroups = messageData.files.reduce((acc, file) => {
                const fileType = file.type;

                if (!acc[fileType]) {
                    acc[fileType] = [];
                }

                acc[fileType].push(file);
                return acc;
            }, {});

            const mediaGroupFiles = [];
            if (fileGroups.photo?.length || fileGroups.video?.length) {
                let isFirstFile = true;
                [...(fileGroups.photo || []), ...(fileGroups.video || [])].forEach(file => {
                    const mediaItem = {
                        type: file.type,
                        media: file.file_id
                    };

                    if (isFirstFile && messageData.text) {
                        mediaItem.caption = messageData.text;
                        isFirstFile = false;
                    }

                    mediaGroupFiles.push(mediaItem);
                });

                if (mediaGroupFiles.length > 0) {
                    try {
                        if (options.chatId) {
                            await ctx.sendMediaGroup(options.chatId, mediaGroupFiles);
                        } else {
                            await ctx.replyWithMediaGroup(mediaGroupFiles);
                        }
                    } catch (error) {
                        if (options.chatId) {
                            await ctx.sendMessage(options.chatId, messageData.text);
                        } else {
                            await ctx.reply(messageData.text);
                        }
                    }
                }
            } else if (messageData.text) {
                if (options.chatId) {
                    await ctx.sendMessage(options.chatId, messageData.text);
                } else {
                    await ctx.reply(messageData.text);
                }
            }

            if (!options.chatId) {
                try {
                    for (const type in fileGroups) {
                        if (type !== 'photo' && type !== 'video') {
                            for (const file of fileGroups[type]) {
                                switch (type) {
                                    case 'document':
                                        await ctx.replyWithDocument(file.file_id);
                                        break;
                                    case 'audio':
                                        await ctx.replyWithAudio(file.file_id);
                                        break;
                                    case 'voice':
                                        await ctx.replyWithVoice(file.file_id);
                                        break;
                                    default:
                                        await ctx.replyWithDocument(file.file_id);
                                }
                            }
                        }
                    }
                } catch (error) {
                    if (options.chatId) {
                        await ctx.sendMessage(options.chatId, messageData.text);
                    } else {
                        await ctx.reply(messageData.text, messageData.keyboard || {});
                    }
                }
            }
        } else if (messageData.text) {
            if (options.chatId) {
                await ctx.sendMessage(options.chatId, messageData.text);
            } else {
                await ctx.reply(messageData.text, messageData.keyboard || {});
            }
        }

        if (messageData.keyboard && messageData.files?.length) {
            if (!options.chatId) {
                await ctx.reply('Выберите действие:', messageData.keyboard);
            }
        }

    } catch (error) {
        console.error(`${dateTimeNow()} Error sending message:`, error);
        try {
            if (!options.chatId) {
                await ctx.reply('Произошла ошибка при отправке сообщения. Попробуйте позже.');
            }
        } catch (fallbackError) {
            console.error(`${dateTimeNow()} Error sending fallback message:`, fallbackError);
        }
    }
};

module.exports = {
    sendMessage
};