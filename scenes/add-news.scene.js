const { Scenes, Markup } = require('telegraf');
const News = require('../models/News');

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
        const fileId = ctx.message.photo ? 
            ctx.message.photo[ctx.message.photo.length - 1].file_id : 
            ctx.message.video.file_id;
            
        ctx.session.newsData.files.push({
            id: fileId,
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
            await News.addPost(ctx.session.user.id, {
                newsText: ctx.session.newsData.text,
                photo: ctx.session.newsData.files.map(f => f.id),
                template: ctx.session.newsData.isTemplate
            });

            await ctx.reply('Новость успешно добавлена!');
            return ctx.scene.enter(ctx.session.user.status === 'admin' ? 'ADMIN_MENU_SCENE' : 'MAIN_MENU_SCENE');
        } catch (error) {
            console.error('Add news error:', error);
            await ctx.reply('Ошибка при добавлении новости. Попробуйте еще раз.');
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
