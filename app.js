const webPage = require('./webpage');
const bot = require('./bot');
const { dateTimeNow } = require('./utils/logging');

const startApp = () => {
    try {
        bot.launch();
        console.log('%s Telegram bot started', dateTimeNow());
    } catch (error) {
        console.log('%s Telegram bot launch error: %s', dateTimeNow(), e);
    }
   
    webPage();
};

startApp();