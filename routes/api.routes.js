const express = require('express');
const pick = require('lodash/pick');
const axios = require('axios');
const Config = require('../config');
const { requireAuth } = require('../middleware/auth');
const bot = require('../bot');
const { sendMessage } = require('../utils/bot-message');

const router = express.Router();

// Apply authentication to all API routes
router.use(requireAuth);

const News = require('../models/News');
const Mailing = require('../models/Mailing');
const Organization = require('../models/Organization');
const Department = require('../models/Department');
const Messages = require('../models/Messages');
const User = require('../models/User');
const Channel = require('../models/Channel');
const Email = require('../models/Email');
const FAQ = require('../models/FAQ');
const NewsChannel = require('../models/NewsChannel');
const Appeal = require('../models/Appeal');
const NewsFiles = require('../models/NewsFiles');
const AppealFiles = require('../models/AppealFiles');

// Middleware for parameter validation
const validateId = (req, res, next) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid ID parameter' });
    }
    req.validatedId = id;
    next();
};

const validatePagination = (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    req.pagination = { page, limit };
    next();
};

// News routes
router.get('/news', validatePagination, async (req, res) => {
    try {
        const { page, limit } = req.pagination;
        const isTemplate = req.query.isTemplate === 'true';
        const isPublished = req.query.isPublished === 'true';

        const result = await News.getPage(page, limit, isTemplate, isPublished);
        res.json(result);
    } catch (err) {
        console.error('Error fetching news:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/news/all', async (req, res) => {
    try {
        const isTemplate = req.query.isTemplate === 'true';

        const result = await News.getAll(isTemplate);
        res.json(result);
    } catch (err) {
        console.error('Error fetching news:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/news/update/:id', validateId, async (req, res) => {
    try {
        const { text } = pick(req.body, ['text']);

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Invalid text parameter' });
        }

        const news = await News.update(req.validatedId, text);
        res.json(news);
    } catch (err) {
        console.error('Error updating news:', err);
        res.status(500).json({ error: 'Failed to update news' });
    }
});

router.post('/news/publish/:id', validateId, async (req, res) => {
    try {
        const news = await News.getById(req.validatedId);
        if (!news) {
            return res.status(404).json({
                error: 'News not found'
            });
        }

        const channels = await NewsChannel.getChannelsByNews(req.validatedId);
        if (!channels) {
            return res.status(404).json({
                error: 'No channels for publication found'
            });
        }

        let files = [];
        try {
            files = await NewsFiles.getFilesByNews(news.id);
        } catch (error) {
            console.error('Error fetching files:', error);
            files = [];
        }

        const stats = {
            total: channels.length,
            success: 0,
            blocked: 0,
            noTelegramId: 0
        };

        for (const channel of channels) {
            if (!channel.link) {
                stats.noTelegramId++;
                continue;
            }

            try {
                await sendMessage(bot.telegram, {
                    text: news.text,
                    files: files,
                    chatId: `@${channel.link}`
                });

                console.log(`News published to channel: ${channel.link}`);

                stats.success++;
            } catch (error) {
                console.log(error);
                if (error.response?.error_code === 403) {
                    stats.blocked++;
                }
                else {
                    stats.noTelegramId++;
                }
            }
        }

        if (stats.success > 0) {
            try {
                await News.updatePublish(news.id);
                return res.json({
                    success: true,
                    stats: stats
                });
            } catch (err) {
                console.error('Error updating publish status:', err);
                res.status(500).json({ error: 'Failed to update publish status' });
            }
        }
    } catch (err) {
        console.error('Error publishing news:', err);
        res.status(500).json({
            error: 'Failed to publish news'
        });
    }
});

// Mailing routes
router.get('/mailing/list', async (req, res) => {
    try {
        const mailings = await Mailing.getAll();
        res.json(mailings);
    } catch (err) {
        console.error('Error fetching mailing list:', err);
        res.status(500).json({ error: 'Failed to fetch mailing list' });
    }
});

router.post('/mailing/create', async (req, res) => {
    try {
        const mailingData = pick(req.body, [
            'title', 'organization', 'department',
            'users', 'position', 'gender',
            'date'
        ]);

        // Basic validation
        if (!mailingData.title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const mailing = await Mailing.create(mailingData);
        res.json(mailing);
    } catch (err) {
        console.error('Error creating mailing:', err);
        res.status(500).json({ error: 'Failed to create mailing' });
    }
});

router.post('/mailing/update/:id', validateId, async (req, res) => {
    try {
        const mailingData = pick(req.body, [
            'title', 'organization', 'department',
            'users', 'position', 'gender',
            'date'
        ]);

        const mailing = await Mailing.update(req.validatedId, mailingData);
        res.json(mailing);
    } catch (err) {
        console.error('Error updating mailing:', err);
        res.status(500).json({ error: 'Failed to update mailing' });
    }
});

router.get('/mailing/:id', validateId, async (req, res) => {
    try {
        const mailing = await Mailing.getById(req.validatedId);
        if (!mailing) {
            return res.status(404).json({ error: 'Mailing not found' });
        }
        res.json(mailing);
    } catch (err) {
        console.error('Error fetching mailing:', err);
        res.status(500).json({ error: 'Failed to fetch mailing' });
    }
});

// Organization routes
router.get('/organizations', async (req, res) => {
    try {
        const orgs = await Organization.getAll();
        res.json(orgs);
    } catch (err) {
        console.error('Error fetching organizations:', err);
        res.status(500).json({ error: 'Failed to fetch organizations' });
    }
});

router.get('/organizations/active', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ error: 'ID parameter is required' });
        }

        const ids = id.split(',').map(Number).filter(id => !isNaN(id) && id > 0);
        if (ids.length === 0) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const orgs = await Organization.getByIds(ids);
        res.json(orgs);
    } catch (err) {
        console.error('Error fetching active organizations:', err);
        res.status(500).json({ error: 'Failed to fetch organizations' });
    }
});

router.get('/organization/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.status(400).json({ error: 'Search query too short' });
        }

        const orgs = await Organization.searchAll(q);
        res.json(orgs);
    } catch (err) {
        console.error('Error searching organizations:', err);
        res.status(500).json({ error: 'Search failed' });
    }
});

router.post('/organization/enable/:id', validateId, async (req, res) => {
    try {
        const { enabled } = pick(req.body, ['enabled']);

        const orgs = await Organization.update(req.validatedId, enabled);
        res.json(orgs);
    } catch (err) {
        console.error('Error searching organizations:', err);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Department routes
router.get('/departments', async (req, res) => {
    try {
        const parent = parseInt(req.query.parent) || 0;

        const deps = parent === 0
            ? await Department.getRoot()
            : await Department.getSubdivision(parent);

        res.json(deps);
    } catch (err) {
        console.error('Error fetching departments:', err);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

router.get('/departments/active', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ error: 'ID parameter is required' });
        }

        const ids = id.split(',')
            .map(Number)
            .filter(id => !isNaN(id) && id > 0);

        if (ids.length === 0) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const deps = await Department.getByIds(ids);
        res.json(deps);
    } catch (err) {
        console.error('Error fetching active departments:', err);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

router.get('/department/search', async (req, res) => {
    try {
        const { q, parent } = req.query;
        if (!q || q.length < 2) {
            return res.status(400).json({ error: 'Search query too short' });
        }

        const parentId = parseInt(parent) || 0;

        const deps = parentId === 0
            ? await Department.searchAll(q)
            : await Department.searchSubdivision(q, parentId);

        res.json(deps);
    } catch (err) {
        console.error('Error searching departments:', err);
        res.status(500).json({ error: 'Search failed' });
    }
});

// User routes
router.get('/users', async (req, res) => {
    try {
        const filters = pick(req.query, ['department', 'organization', 'position', 'gender']);
        const users = await User.getUsersWithFilter(filters);
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.get('/users/admins', async (req, res) => {
    try {
        const users = await User.getAdmins();
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.get('/users/active', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ error: 'ID parameter is required' });
        }

        const ids = id.split(',')
            .map(Number)
            .filter(id => !isNaN(id) && id > 0);

        if (ids.length === 0) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const users = await User.getByIds(ids);
        res.json(users);
    } catch (err) {
        console.error('Error fetching active users:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.get('/users/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.status(400).json({ error: 'Search query too short' });
        }

        const filters = pick(req.query, ['department', 'organization', 'position', 'gender']);
        const users = await User.searchAll(q, filters);
        res.json(users);
    } catch (err) {
        console.error('Error searching users:', err);
        res.status(500).json({ error: 'Search failed' });
    }
});

router.patch('/users/:id', validateId, async (req, res) => {
    try {
        const userData = pick(req.body, [
            'name', 'email', 'department',
            'organization', 'position', 'gender'
        ]);

        const updatedUser = await User.update(req.validatedId, userData);
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(updatedUser);
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Messages routes
router.get('/messages', async (req, res) => {
    try {
        const messages = await Messages.getAll();
        res.json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

router.post('/message/create', async (req, res) => {
    try {
        const messageData = pick(req.body, [
            'name',
            'title',
            'group_id',
            'news'
        ]);

        if (!messageData.name || !messageData.title || !messageData.group_id) {
            return res.status(400).json({
                error: 'Name, title and group_id are required'
            });
        }

        const message = await Messages.create(messageData);
        res.json(message);
    } catch (err) {
        console.error('Error creating message:', err);

        if (err.code === '23505') {
            return res.status(409).json({
                error: 'Message with this name already exists'
            });
        }

        res.status(500).json({
            error: 'Failed to create message'
        });
    }
});

router.post('/message/update/:id', validateId, async (req, res) => {
    try {
        const messageData = pick(req.body, ['news']);

        const updatedMessage = await Messages.update(req.validatedId, {
            news_id: messageData.news || null
        });

        res.json({
            id: updatedMessage.id,
            name: updatedMessage.name,
            title: updatedMessage.title,
            group_id: updatedMessage.group_id,
            newsTitle: updatedMessage.news_text,
            news: updatedMessage.news_id
        });
    } catch (err) {
        console.error('Error updating message:', err);
        res.status(500).json({
            error: 'Failed to update message'
        });
    }
});

// Channel routes
router.get('/channels', async (req, res) => {
    try {
        const channels = await Channel.getAll();
        res.json(channels);
    } catch (err) {
        console.error('Error fetching channels:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/channel/:id', validateId, async (req, res) => {
    try {
        const channel = await Channel.getById(req.validatedId);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        res.json(channel);
    } catch (err) {
        console.error('Error fetching channel:', err);
        res.status(500).json({ error: 'Failed to fetch channel' });
    }
});

router.post('/channel/create', async (req, res) => {
    try {
        const channelData = pick(req.body, ['link', 'name']);

        if (!channelData.link) {
            return res.status(400).json({ error: 'Link is required' });
        }

        const channel = await Channel.create(channelData);
        res.json(channel);
    } catch (err) {
        console.error('Error creating channel:', err);
        res.status(500).json({ error: 'Failed to create channel' });
    }
});

router.post('/channel/update/:id', validateId, async (req, res) => {
    try {
        const channelData = pick(req.body, ['link', 'name']);
        const channel = await Channel.update(req.validatedId, channelData);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        res.json(channel);
    } catch (err) {
        console.error('Error updating channel:', err);
        res.status(500).json({ error: 'Failed to update channel' });
    }
});

router.delete('/channel/:id', validateId, async (req, res) => {
    try {
        await Channel.delete(req.validatedId);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting channel:', err);
        res.status(500).json({ error: 'Failed to delete channel' });
    }
});

// Email routes
router.get('/emails', async (req, res) => {
    try {
        const { organization } = req.query;
        const emails = organization
            ? await Email.getByOrganization(parseInt(organization))
            : await Email.getAll();
        res.json(emails);
    } catch (err) {
        console.error('Error fetching emails:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/email/create', async (req, res) => {
    try {
        const emailData = pick(req.body, ['address', 'type', 'organization', 'user']);

        if (!emailData.address) {
            return res.status(400).json({ error: 'Email address is required' });
        }

        const email = await Email.create(emailData);
        res.json(email);
    } catch (err) {
        console.error('Error creating email:', err);
        res.status(500).json({ error: 'Failed to create email' });
    }
});

router.post('/email/update/:id', validateId, async (req, res) => {
    try {
        const emailData = pick(req.body, ['address', 'type', 'organization', 'user']);
        const email = await Email.update(req.validatedId, emailData);
        if (!email) {
            return res.status(404).json({ error: 'Email not found' });
        }
        res.json(email);
    } catch (err) {
        console.error('Error updating email:', err);
        res.status(500).json({ error: 'Failed to update email' });
    }
});

router.delete('/email/:id', validateId, async (req, res) => {
    try {
        await Email.delete(req.validatedId);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting email:', err);
        res.status(500).json({ error: 'Failed to delete email' });
    }
});

// FAQ routes
router.get('/faqs', async (req, res) => {
    try {
        const { category } = req.query;
        const faqs = category
            ? await FAQ.getByCategory(category)
            : await FAQ.getAll();
        res.json(faqs);
    } catch (err) {
        console.error('Error fetching FAQs:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/faq/create', async (req, res) => {
    try {
        const faqData = pick(req.body, ['category', 'question', 'answer']);

        if (!faqData.question || !faqData.answer) {
            return res.status(400).json({ error: 'Question and answer are required' });
        }

        const faq = await FAQ.create(faqData);
        res.json(faq);
    } catch (err) {
        console.error('Error creating FAQ:', err);
        res.status(500).json({ error: 'Failed to create FAQ' });
    }
});

router.post('/faq/update/:id', validateId, async (req, res) => {
    try {
        const faqData = pick(req.body, ['category', 'question', 'answer']);
        const faq = await FAQ.update(req.validatedId, faqData);
        if (!faq) {
            return res.status(404).json({ error: 'FAQ not found' });
        }
        res.json(faq);
    } catch (err) {
        console.error('Error updating FAQ:', err);
        res.status(500).json({ error: 'Failed to update FAQ' });
    }
});

router.delete('/faq/:id', validateId, async (req, res) => {
    try {
        await FAQ.delete(req.validatedId);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting FAQ:', err);
        res.status(500).json({ error: 'Failed to delete FAQ' });
    }
});

// News-Channel junction routes
router.get('/news-channel/:id', validateId, async (req, res) => {
    try {
        const channels = await NewsChannel.getEntriesByNews(req.validatedId);
        res.json(channels);
    } catch (err) {
        console.log('Error fetching news channels:', err);
        res.status(500).json({ error: 'Failed to fetch channels' });
    }
});

router.get('/news-channel/channel-data/:id', validateId, async (req, res) => {
    try {
        const channels = await NewsChannel.getChannelsByNews(req.validatedId);
        res.json(channels);
    } catch (err) {
        console.error('Error fetching news channels:', err);
        res.status(500).json({ error: 'Failed to fetch channels' });
    }
});

router.post('/news-channel', async (req, res) => {
    try {
        const { newsId, channelId } = req.body;
        if (!channelId || !newsId) {
            return res.status(400).json({ error: 'News and Channel IDs are required' });
        }

        const result = await NewsChannel.create(newsId, channelId);
        res.json(result);
    } catch (err) {
        console.error('Error adding channel to news:', err);
        res.status(500).json({ error: 'Failed to add channel' });
    }
});

router.delete('/news-channel/:id', validateId, async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        await NewsChannel.delete(id);
        res.json({ success: true });
    } catch (err) {
        console.error('Error removing channel from news:', err);
        res.status(500).json({ error: 'Failed to remove channel' });
    }
});

router.post('/news-channel/insert-multiple', async (req, res) => {
    try {
        const { newsId, channelIds } = req.body;

        if (!Array.isArray(channelIds) || channelIds.some(id => isNaN(parseInt(id))) || isNaN(parseInt(newsId))) {
            return res.status(400).json({ error: 'Invalid IDs array' });
        }

        await NewsChannel.insertMultiple(parseInt(newsId), channelIds.map(id => parseInt(id)));
        res.json({ success: true });
    } catch (err) {
        console.error('Error removing channels from news:', err);
        res.status(500).json({ error: 'Failed to remove channels' });
    }
});

router.post('/news-channel/delete-multiple', async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.some(id => isNaN(parseInt(id)))) {
            return res.status(400).json({ error: 'Invalid IDs array' });
        }

        await NewsChannel.deleteMultiple(ids.map(id => parseInt(id)));
        res.json({ success: true });
    } catch (err) {
        console.error('Error removing channels from news:', err);
        res.status(500).json({ error: 'Failed to remove channels' });
    }
});

// Appeal routes
router.get('/appeals', validatePagination, async (req, res) => {
    try {
        const { page, limit } = req.pagination;
        const isResponded = req.query.isResponded === 'true';

        const result = await Appeal.getPage(page, limit, isResponded);
        res.json(result);
    } catch (err) {
        console.error('Error fetching appeals:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/appeal/reply/:id', validateId, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                error: 'Valid reply text is required'
            });
        }

        const appeal = await Appeal.getById(req.validatedId);
        if (!appeal) {
            return res.status(404).json({
                error: 'Appeal not found'
            });
        }

        try {
            const formattedText = `🔔 Ответ на ваше обращение:\n${appeal.text.slice(0, 100)}${appeal.text.length >= 100 ? '...' : ''}\n\n🗣️ ${text}`;

            await sendMessage(bot.telegram, {
                text: formattedText,
                chatId: appeal.tgchat
            });

            var updatedAppeal = await Appeal.updateResponded(req.validatedId);
        } catch (botError) {
            console.error('Failed to send telegram notification:', botError);
        }

        res.json(updatedAppeal);

    } catch (err) {
        console.error('Error replying to appeal:', err);
        res.status(500).json({
            error: 'Failed to reply to appeal'
        });
    }
});

// Files

router.get('/files/news/:id', validateId, async (req, res) => {
    try {
        const id = req.params.id;
        const files = await NewsFiles.getFilesByNews(req.validatedId);

        if (!files || files?.length === 0) {
            return res.status(200).json([]);
        }

        res.send(files);
    } catch (err) {
        console.error('Error fetching files:', err);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});


router.get('/files/appeal/:id', validateId, async (req, res) => {
    try {
        const id = req.params.id;
        const files = await AppealFiles.getFilesByAppeal(req.validatedId);

        if (!files || files?.length === 0) {
            return res.status(200).json([]);
        }

        res.send(files);
    } catch (err) {
        console.error('Error fetching files:', err);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

// Telegram image
router.get('/tg/image/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await axios.get(`https://api.telegram.org/bot${Config.TELEGRAM_TOKEN}/getFile?file_id=${id}`);
        const filePath = response.data.result.file_path;

        const imageResponse = await axios.get(
            `https://api.telegram.org/file/bot${Config.TELEGRAM_TOKEN}/${filePath}`,
            { responseType: 'stream' }
        );

        res.set('Content-Type', imageResponse.headers['content-type']);
        imageResponse.data.pipe(res);
    } catch (err) {
        console.error('Error fetching image:', err);
        res.status(404).json({ error: 'Image not found' });
    }
});


module.exports = router;