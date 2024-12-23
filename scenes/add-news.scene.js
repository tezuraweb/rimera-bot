const { Scenes, Markup } = require('telegraf');
const News = require('../models/News');
const Channel = require('../models/Channel');
const NewsChannel = require('../models/NewsChannel');
const NewsFiles = require('../models/NewsFiles');

const MAX_TEXT_LENGTH = 1024; 
const HELP_TEXT = `
📝 Создание новости:

1. Отправьте текст новости (до ${MAX_TEXT_LENGTH} символов)
2. Добавьте фото или видео (опционально)
3. Нажмите "Отправить новость"

✏️ Чтобы изменить текст - отредактируйте исходное сообщение
❌ Чтобы удалить медиафайл - удалите сообщение с ним
`.trim();

class NewsScene {
    constructor() {
        const scene = new Scenes.BaseScene('ADD_NEWS_SCENE');
        
        scene.enter(this.initSession.bind(this));
        scene.on('text', this.handleText.bind(this));
        scene.on(['photo', 'video'], this.handleMedia.bind(this));
        scene.action('send', this.handleSend.bind(this));
        scene.action('help', this.showHelp.bind(this));
        scene.action('back', this.handleBack.bind(this));
        scene.action('toggle_template', this.toggleTemplate.bind(this));
        scene.action('skip_channels', this.handleSkipChannels.bind(this));
        scene.action('complete_channels', this.handleCompleteChannels.bind(this));
        scene.action(/select_channel_\d+/, this.handleChannelSelection.bind(this));
        scene.on('edited_message', this.handleEdit.bind(this));
        scene.on('message_delete', this.handleDelete.bind(this));

        return scene;
    }

    buildKeyboard(ctx) {
        if (ctx.session.user.status === 'admin') {
            return Markup.inlineKeyboard([
                [Markup.button.callback(
                    ctx.session.newsData?.isTemplate ? 'Отменить шаблон' : 'Сделать шаблоном', 
                    'toggle_template'
                )],        
                [Markup.button.callback('📤 Отправить новость', 'send')],
                [Markup.button.callback('❓ Помощь', 'help')],
                [Markup.button.callback('⬅️ Назад', 'back')]
            ]);
        } else {
            return Markup.inlineKeyboard([
                [Markup.button.callback('📤 Отправить новость', 'send')],
                [Markup.button.callback('❓ Помощь', 'help')],
                [Markup.button.callback('⬅️ Назад', 'back')]
            ]);
        }
    }

    buildChannelsKeyboard(channels, selectedIds = []) {
        const channelButtons = channels.map(channel => {
            const checkmark = selectedIds.includes(channel.id) ? '✅ ' : '';
            return [Markup.button.callback(`${checkmark} ${channel.name} (@${channel.link})`, `select_channel_${channel.id}`)];
        });

        return Markup.inlineKeyboard([
            ...channelButtons,
            [
                Markup.button.callback('Пропустить', 'skip_channels'),
                Markup.button.callback('Завершить', 'complete_channels')
            ]
        ]);
    }

    async toggleTemplate(ctx) {
        ctx.session.newsData.isTemplate = !ctx.session.newsData.isTemplate;
        await ctx.editMessageReplyMarkup(this.buildKeyboard(ctx).reply_markup);
    }

    async initSession(ctx) {
        ctx.session.newsData = {
            text: null,
            textMessageId: null,
            files: [],
            isTemplate: false
        };

        await ctx.reply('Отправьте текст новости и медиафайлы:', this.buildKeyboard(ctx));
    }

    async handleText(ctx) {
        if (ctx.session.newsData.text) {
            return ctx.reply('Текст уже добавлен. Отредактируйте существующее сообщение, если хотите его изменить.');
        }

        if (ctx.message.text.length > MAX_TEXT_LENGTH) {
            return ctx.reply(`Текст превышает ${MAX_TEXT_LENGTH} символов. Сократите сообщение.`);
        }

        ctx.session.newsData.text = ctx.message.text;
        ctx.session.newsData.textMessageId = ctx.message.message_id;
        await ctx.reply('Текст сохранен. Добавьте медиафайлы или отправьте новость.');
    }

    async handleMedia(ctx) {        
        let fileId;
        let fileType;
        
        if (ctx.message.photo) {
            fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
            fileType = 'photo';
        } else if (ctx.message.video) {
            fileId = ctx.message.video.file_id;
            fileType = 'video';
        } else if (ctx.message.document) {
            fileId = ctx.message.document.file_id;
            fileType = 'document';
        } else if (ctx.message.audio) {
            fileId = ctx.message.audio.file_id;
            fileType = 'audio';
        } else if (ctx.message.voice) {
            fileId = ctx.message.voice.file_id;
            fileType = 'voice';
        } else {
            await ctx.reply('Неподдерживаемый тип медиафайла.');
            return;
        }
            
        ctx.session.newsData.files.push({
            fileId,
            fileType,
            messageId: ctx.message.message_id
        });
        await ctx.reply('Медиафайл добавлен.');
    }

    async handleEdit(ctx) {
        if (ctx.editedMessage.text && 
            ctx.editedMessage.message_id === ctx.session.newsData.textMessageId) {
            
            if (ctx.editedMessage.text.length > MAX_TEXT_LENGTH) {
                return ctx.reply(`Текст превышает ${MAX_TEXT_LENGTH} символов. Сократите сообщение.`);
            }

            ctx.session.newsData.text = ctx.editedMessage.text;
            await ctx.reply('Текст новости обновлен.');
        }
    }

    async handleDelete(ctx) {
        if (ctx.message.message_id === ctx.session.newsData.textMessageId) {
            ctx.session.newsData.text = null;
            ctx.session.newsData.textMessageId = null;
            await ctx.reply('Текст новости удален.');
        }

        ctx.session.newsData.files = ctx.session.newsData.files.filter(
            file => file.messageId !== ctx.message.message_id
        );
    }

    async handleSend(ctx) {
        if (!ctx.session.newsData.text) {
            return ctx.reply('Необходимо добавить текст новости!');
        }

        try {
            const { id: newsId } = await News.addPost(ctx.session.user.id, {
                newsText: ctx.session.newsData.text,
                template: ctx.session.newsData.isTemplate
            });
            
            if (ctx.session.newsData.files.length > 0) {
                const filesData = ctx.session.newsData.files.map(file => ({
                    news_id: newsId,
                    file_id: file.fileId,
                    type: file.fileType
                }));
                
                await NewsFiles.insertMultiple(filesData);
            }

            await ctx.reply('Новость успешно добавлена!');

            if (!ctx.session.newsData.isTemplate) {
                // Initialize channel selection
                ctx.session.channelSelection = {
                    newsId,
                    selectedChannels: []
                };

                const channels = await Channel.getAll();
                return ctx.reply(
                    'Выберите каналы для публикации:',
                    this.buildChannelsKeyboard(channels)
                );
            }

            return ctx.scene.enter(ctx.session.user.status === 'admin' ? 'ADMIN_MENU_SCENE' : 'MAIN_MENU_SCENE');
        } catch (error) {
            console.error('Add news error:', error);
            await ctx.reply('Ошибка при добавлении новости. Попробуйте еще раз.');
        }
    }

    async handleChannelSelection(ctx) {
        const channelId = parseInt(ctx.match[0].replace('select_channel_', ''));
        const { selectedChannels } = ctx.session.channelSelection;

        // Toggle channel selection
        const index = selectedChannels.indexOf(channelId);
        if (index === -1) {
            selectedChannels.push(channelId);
        } else {
            selectedChannels.splice(index, 1);
        }

        // Update keyboard with new selection state
        const channels = await Channel.getAll();
        await ctx.editMessageReplyMarkup(
            this.buildChannelsKeyboard(channels, selectedChannels).reply_markup
        );
    }

    async handleSkipChannels(ctx) {
        await ctx.reply('Публикация в каналы пропущена');
        return ctx.scene.enter(ctx.session.user.status === 'admin' ? 'ADMIN_MENU_SCENE' : 'MAIN_MENU_SCENE');
    }

    async handleCompleteChannels(ctx) {
        const { newsId, selectedChannels } = ctx.session.channelSelection;

        try {
            if (selectedChannels.length > 0) {
                await NewsChannel.insertMultiple(newsId, selectedChannels);
                await ctx.reply('Каналы для публикации выбраны');
            }
            
            return ctx.scene.enter(ctx.session.user.status === 'admin' ? 'ADMIN_MENU_SCENE' : 'MAIN_MENU_SCENE');
        } catch (error) {
            console.error('Error saving channel selection:', error);
            await ctx.reply('Ошибка при сохранении выбранных каналов. Попробуйте еще раз.');
        }
    }

    async showHelp(ctx) {
        await ctx.reply(HELP_TEXT);
    }

    handleBack(ctx) {
        return ctx.scene.enter(ctx.session.user.status === 'admin' ? 'ADMIN_MENU_SCENE' : 'MAIN_MENU_SCENE');
    }
}

module.exports = NewsScene;
