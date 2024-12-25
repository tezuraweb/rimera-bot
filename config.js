const dotenv = require('dotenv');
const path = require('path');

const root = path.join.bind(this, __dirname);
dotenv.config({ path: root('.env') });

module.exports = {
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    TOKEN_SECRET: process.env.TOKEN_SECRET,

    // Telegram Configuration
    TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,

    // Database Configuration
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,

    // SMTP Configuration
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.example.com',
    SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
    SMTP_USER: process.env.SMTP_USER || 'your-email@example.com',
    SMTP_PASS: process.env.SMTP_PASS || 'your-password',
    SMTP_FROM: process.env.SMTP_FROM || 'Notification System <notifications@example.com>'
};
