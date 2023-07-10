const Config = require('./config');
const { Telegraf, Scenes, session } = require('telegraf');
const SceneGenerator = require('./scenes');
const { dateTimeNow } = require('./utils/logging');

const createBot = () => {
    try {
        const bot = new Telegraf(Config.TELEGRAM_TOKEN, {});

        const curScene = new SceneGenerator();
        const authScene = curScene.AuthScene();
        const menuScene = curScene.MainMenuScene();
        const adminMenuScene = curScene.AdminMenuScene();
        const newsScene = curScene.AddNewsScene();
        const mailingScene = curScene.MailingScene();

        bot.use(async (ctx, next) => {
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

        // bot.use(Telegraf.log());

        const stage = new Scenes.Stage([
            authScene,
            menuScene,
            adminMenuScene,
            newsScene,
            mailingScene,
        ]);

        bot.use(session());
        bot.use(stage.middleware());

        bot.command('start', (ctx) => {
            ctx.scene.enter('AUTH_SCENE');
        });

        console.log('%s Telegram bot created', dateTimeNow());

        return bot;
    } catch (e) {
        console.log('%s Telegram bot creation error: %s', dateTimeNow(), e);
    }
}

module.exports = createBot();