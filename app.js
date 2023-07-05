const webPage = require('./webpage');
const bot = require('./bot');

const startApp = () => {
    bot.launch();
    webPage();
};

startApp();