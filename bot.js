const { Telegraf, Scenes, session } = require('telegraf');
const Config = require('./config');
const { dateTimeNow } = require('./utils/logging');
const userAuth = require('./middleware/bot-auth');

const AuthScene = require('./scenes/auth.scene');
const MainMenuScene = require('./scenes/main-menu.scene');
const AdminMenuScene = require('./scenes/admin-menu.scene');
const NewsScene = require('./scenes/add-news.scene');
const MailingScene = require('./scenes/mailing.scene');
// const FeedbackScene = require('./scenes/feedback.scene');
// const AppealScene = require('./scenes/appeal.scene');

const createBot = () => {
    try {
        const bot = new Telegraf(Config.TELEGRAM_TOKEN);

        const scenes = [
            new AuthScene(),
            new MainMenuScene(),
            new AdminMenuScene(),
            new NewsScene(),
            new MailingScene(),
            // new FeedbackScene,
            // new AppealScene,
        ];

        const stage = new Scenes.Stage(scenes);

        bot.use(session({
            defaultSession: () => ({
                user: null,
            })
        }));

        bot.use(userAuth);
        bot.use(stage.middleware());

        bot.use(async (ctx, next) => {
            const start = new Date();
            await next();
            const ms = new Date() - start;
        });

        bot.command('start', (ctx) => ctx.scene.enter('AUTH_SCENE'));

        console.log('%s Telegram bot created', dateTimeNow());
        return bot;
    } catch (e) {
        console.log('%s Telegram bot creation error: %s', dateTimeNow(), e);
    }
};

module.exports = createBot();