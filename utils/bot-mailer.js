// utils/email.js
const nodemailer = require('nodemailer');
const Email = require('../models/Email');
const Config = require('../config');
const User = require('../models/User');

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: Config.SMTP_HOST,
    port: Config.SMTP_PORT,
    secure: Config.SMTP_SECURE,
    auth: {
        user: Config.SMTP_USER,
        pass: Config.SMTP_PASS
    }
});

/**
 * Sends an appeal notification email
 * @param {Object} appealData - Appeal information
 * @param {string} appealData.text - Appeal text
 * @param {string} appealData.type - Appeal type
 * @param {number} appealData.organization - Organization ID
 * @param {Object} userData - User information who created the appeal
 * @returns {Promise<void>}
 */
async function sendAppealNotification(appealData, userData) {
    try {
        // Get the email address for this appeal type and organization
        const emailRecords = await Email.getByOrgType(appealData.organization, appealData.type);

        if (emailRecords?.length === 0) {
            console.error('No email configuration found for:', {
                type: appealData.type,
                organization: appealData.organization
            });
            return;
        }

        // Prepare email content
        for(const emailRecord of emailRecords) {
            const mailOptions = {
                from: Config.SMTP_FROM,
                to: emailRecord.address,
                subject: `Новое обращение: ${getAppealTypeText(appealData.type)}`,
                html: `
                    <h2>Получено новое обращение</h2>
                    <p><strong>Тип обращения:</strong> ${getAppealTypeText(appealData.type)}</p>
                    <p><strong>От пользователя:</strong> ${userData.name}</p>
                    <p><strong>Текст обращения:</strong></p>
                    <p>${appealData.text}</p>
                    <hr>
                    <p><em>Это автоматическое уведомление. Пожалуйста, не отвечайте на это письмо.</em></p>
                `
            };
    
            // Send email
            await transporter.sendMail(mailOptions);
        }
        
        console.log('Appeal notification email sent successfully');
    } catch (error) {
        console.error('Error sending appeal notification email:', error);
    }
}

/**
 * Converts appeal type code to human-readable text
 * @param {string} type - Appeal type code
 * @returns {string}
 */
function getAppealTypeText(type) {
    const types = {
        appeal_feature: 'Предложение по улучшению',
        appeal_problem: 'Сообщение о проблеме',
        appeal_contacts: 'Запрос контактной информации',
        appeal_security: 'Вопрос по безопасности',
        appeal_ceo: 'Обращение к руководству',
        appeal_hr: 'Вопрос по трудоустройству',
        appeal_labour: 'Вопрос по охране труда'
    };
    return types[type] || type;
}

module.exports = {
    sendAppealNotification
};