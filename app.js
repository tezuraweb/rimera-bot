const webPage = require('./webpage');
const bot = require('./bot');
const { dateTimeNow } = require('./utils/logging');
const { scheduleReminders } = require('./utils/daily-reminder');

const startApp = () => {
    try {
        // const bot = createBot();
        bot.launch();
        console.log('%s Telegram bot started', dateTimeNow());

        scheduleReminders();
    } catch (error) {
        console.log('%s Telegram bot launch error: %s', dateTimeNow(), error);
    }
    
    webPage();
};

startApp();