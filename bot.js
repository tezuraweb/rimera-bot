const Config = require('./config');
const { Telegraf, Scenes, session } = require('telegraf');
const SceneGenerator = require('./scenes');
const { dateTimeNow } = require('./utils/logging');

class Bot {
    constructor() {
        try {
            this.bot = new Telegraf(Config.TELEGRAM_TOKEN, {});
            this.launched = false;
    
            this.init();
    
            console.log('%s Telegram bot created', dateTimeNow());
        } catch (e) {
            console.log('%s Telegram bot creation error: %s', dateTimeNow(), e);
        }
    }

    init() {
        const curScene = new SceneGenerator();
        const authScene = curScene.AuthScene();
        const menuScene = curScene.MainMenuScene();
        const adminMenuScene = curScene.AdminMenuScene();
        const newsScene = curScene.AddNewsScene();
        const mailingScene = curScene.MailingScene();


        this.bot.use(async (ctx, next) => {
            const start = new Date();
            await next();
            const ms = new Date() - start;
            // console.log(
            //     '%s Chat id: %s response time: %sms',
            //     dateTimeNow(),
            //     ctx.from.id,
            //     ms
            // );
        });

        // this.bot.use(Telegraf.log());

        const stage = new Scenes.Stage([
            authScene,
            menuScene,
            adminMenuScene,
            newsScene,
            mailingScene,
        ]);

        this.bot.use(session());
        this.bot.use(stage.middleware());

        this.bot.command('start', (ctx) => {
            ctx.scene.enter('AUTH_SCENE');
        });
    }

    launch() {
        try {
            this.bot.launch();
            this.launched = true;
            console.log('%s Telegram bot started', dateTimeNow());
        } catch (e) {
            console.log('%s Telegram bot launch error: %s', dateTimeNow(), e);
        }
    }
}

module.exports = new Bot();