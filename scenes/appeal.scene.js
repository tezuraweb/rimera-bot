const { Scenes, Markup } = require('telegraf');
const Organization = require('../models/Organization');
const Appeal = require('../models/Appeal');
const AppealFiles = require('../models/AppealFiles');
const { sendAppealNotification } = require('../utils/bot-mailer');
const { sendMessage } = require('../utils/bot-message');

const MAX_TEXT_LENGTH = 1024;
const DIRECTIONS = {
    FEATURE: 'appeal_feature',
    PROBLEM: 'appeal_problem',
    CONTACTS: 'appeal_contacts'
};

class AppealScene {
    constructor() {
        const scene = new Scenes.BaseScene('APPEAL_SCENE');

        scene.enter(this.initSession.bind(this));
        scene.action('back', this.handleBack.bind(this));
        scene.action('send', this.handleSend.bind(this));
        scene.action('appeal_security', this.gotoSecurity.bind(this));
        scene.action('appeal_ceo', this.gotoCeo.bind(this));
        scene.action('appeal_hr', this.gotoHr.bind(this));
        scene.action('appeal_labour', this.gotoLabour.bind(this));
        scene.action(/org_\d+/, this.handleOrganizationSelection.bind(this));
        scene.on('text', this.handleText.bind(this));
        scene.on(['photo', 'video'], this.handleMedia.bind(this));
        scene.on('edited_message', this.handleEdit.bind(this));

        return scene;
    }

    buildOrganizationsKeyboard(organizations) {
        const orgButtons = organizations.map(org => ([
            Markup.button.callback(org.name, `org_${org.id}`)
        ]));

        return Markup.inlineKeyboard([
            ...orgButtons,
            [Markup.button.callback('⬅️ Назад', 'back')]
        ]);
    }

    getStaticKeyboard(ctx) {
        if (!ctx.session.appealData.text) {
            return Markup.inlineKeyboard([
                [Markup.button.callback('⬅️ Назад', 'back')]
            ]);
        } else {
            return Markup.inlineKeyboard([
                [Markup.button.callback('📤 Отправить обращениe', 'send')],
                [Markup.button.callback('⬅️ Назад', 'back')]
            ]);
        }
    }

    async initSession(ctx) {
        ctx.session.appealData = {
            organization: null,
            text: null,
            textMessageId: null,
            files: [],
            type: ctx.session.direction || DIRECTIONS.FEEDBACK,
            organizations: []
        };

        try {
            ctx.session.appealData.organizations = await Organization.getForBot() || [];

            await this.sendMessage(ctx, ctx.session.appealData.type != 'appeal_contacts');
        } catch (error) {
            console.error('Error setting up scene:', error);
            await ctx.reply('Произошла ошибка. Попробуйте позже.');
            return this.handleBack(ctx);
        }
    }

    async handleOrganizationSelection(ctx) {
        const orgId = parseInt(ctx.match[0].replace('org_', ''));
        ctx.session.appealData.organization = orgId;

        await ctx.reply(
            `Пожалуйста, напишите текст вашего обращения:`,
            this.getStaticKeyboard(ctx)
        );
    }

    async gotoSecurity(ctx) {
        this.setContactMessage(ctx, 'appeal_security');
    }

    async gotoCeo(ctx) {
        this.setContactMessage(ctx, 'appeal_ceo');
    }

    async gotoHr(ctx) {
        this.setContactMessage(ctx, 'appeal_hr');
    }

    async gotoLabour(ctx) {
        this.setContactMessage(ctx, 'appeal_labour');
    }

    async setContactMessage(ctx, type) {
        try {
            ctx.session.appealData.type = type;

            await this.sendMessage(ctx);
        } catch (error) {
            console.error('Error setting up scene:', error);
            await ctx.reply('Произошла ошибка. Попробуйте позже.');
            return this.handleBack(ctx);
        }
    }

    async handleText(ctx) {
        if (!ctx.session.appealData.organization) {
            return ctx.reply(
                'Пожалуйста, сначала выберите организацию.',
                this.getStaticKeyboard(ctx)
            );
        }

        if (ctx.session.appealData.text) {
            return ctx.reply(
                'Текст уже добавлен. Отредактируйте существующее сообщение, если хотите его изменить.',
                this.getStaticKeyboard(ctx)
            );
        }

        if (ctx.message.text.length > MAX_TEXT_LENGTH) {
            return ctx.reply(
                `Текст превышает ${MAX_TEXT_LENGTH} символов. Сократите сообщение.`,
                this.getStaticKeyboard(ctx)
            );
        }

        ctx.session.appealData.text = ctx.message.text;
        ctx.session.appealData.textMessageId = ctx.message.message_id;
        await ctx.reply(
            'Текст сохранен. Добавьте медиафайлы или отправьте обращение.',
            this.getStaticKeyboard(ctx)
        );
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
            await ctx.reply(
                'Неподдерживаемый тип медиафайла.',
                this.getStaticKeyboard(ctx)
            );
            return;
        }

        ctx.session.appealData.files.push({
            fileId,
            fileType,
            messageId: ctx.message.message_id
        });
        await ctx.reply(
            'Медиафайл добавлен.',
            this.getStaticKeyboard(ctx)
        );
    }

    async handleEdit(ctx) {
        if (ctx.editedMessage.text &&
            ctx.editedMessage.message_id === ctx.session.appealData.textMessageId) {

            if (ctx.editedMessage.text.length > MAX_TEXT_LENGTH) {
                return ctx.reply(
                    `Текст превышает ${MAX_TEXT_LENGTH} символов. Сократите сообщение.`,
                    this.getStaticKeyboard(ctx)
                );
            }

            ctx.session.appealData.text = ctx.editedMessage.text;
            await ctx.reply(
                'Текст обращения обновлен.',
                this.getStaticKeyboard(ctx)
            );
        }
    }

    async handleSend(ctx) {
        if (!ctx.session.appealData.text) {
            return ctx.reply(
                'Необходимо добавить текст обращения!',
                this.getStaticKeyboard(ctx)
            );
        }

        try {
            const { id: appealId } = await Appeal.create(
                ctx.session.appealData.text,
                ctx.session.appealData.type,
                ctx.session.user.id,
                ctx.session.appealData.organization
            );

            if (ctx.session.appealData.files.length > 0) {
                const filesData = ctx.session.appealData.files.map(file => ({
                    appeal_id: appealId,
                    file_id: file.fileId,
                    type: file.fileType
                }));

                await AppealFiles.insertMultiple(filesData);
            }

            try {
                sendAppealNotification(
                    {
                        text: ctx.session.appealData.text,
                        type: ctx.session.appealData.type,
                        organization: ctx.session.appealData.organization
                    },
                    ctx.session.user
                );
            } catch (emailError) {
                console.error('Failed to send email notification:', emailError);
            }

            await ctx.reply('Ваш запрос принят. Ожидайте ответа.');
            return ctx.scene.enter(
                ctx.session.user.status === 'admin' ? 'ADMIN_MENU_SCENE' : 'MAIN_MENU_SCENE'
            );
        } catch (error) {
            console.error('Error creating appeal:', error);
            await ctx.reply('Произошла ошибка при создании обращения. Попробуйте позже.');
            return this.handleBack(ctx);
        }
    }

    handleBack(ctx) {
        return ctx.scene.enter(
            ctx.session.user.status === 'admin' ? 'ADMIN_MENU_SCENE' : 'MAIN_MENU_SCENE'
        );
    }

    async sendMessage(ctx, orgs = true) {
        try {
            const keyboard = orgs ?
                this.buildOrganizationsKeyboard(ctx.session.appealData.organizations) :
                Markup.inlineKeyboard([
                    [Markup.button.callback('Обращение к руководству', 'appeal_ceo')],
                    [Markup.button.callback('Вопросы по трудоустройству', 'appeal_hr')],
                    [Markup.button.callback('Вопросы по охране труда', 'appeal_labour')],
                    [Markup.button.callback('Вопросы по безопасности', 'appeal_security')],
                    [Markup.button.callback('⬅️ Назад', 'back')]
                ]);

            await sendMessage(ctx, { messageName: ctx.session.appealData.type, keyboard });
        } catch (error) {
            console.error('Error sending message:', error);
            await ctx.reply('Произошла ошибка при отправке сообщения.');
        }
    }
}

module.exports = AppealScene;