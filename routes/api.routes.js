const express = require('express');
const pick = require('lodash/pick');
const router = express.Router();

// Import models
const News = require('../models/News');
const Mailing = require('../models/Mailing');
const Organization = require('../models/Organization');
const Department = require('../models/Department');
const Messages = require('../models/Messages');
const User = require('../models/User');
const bot = require('../bot');

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
        
        const result = await News.getPage(page, limit, isTemplate);
        res.json(result);
    } catch (err) {
        console.error('Error fetching news:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/news/image/:id', validateId, async (req, res) => {
    try {
        const fileLink = await bot.telegram.getFileLink(req.validatedId);
        res.json({ href: fileLink.href });
    } catch (err) {
        console.error('Error fetching image:', err);
        res.status(404).json({ error: 'Image not found' });
    }
});

router.post('/news-update/:id', validateId, async (req, res) => {
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

// Mailing routes
router.get('/mailing-list', async (req, res) => {
    try {
        const mailings = await Mailing.getAll();
        res.json(mailings);
    } catch (err) {
        console.error('Error fetching mailing list:', err);
        res.status(500).json({ error: 'Failed to fetch mailing list' });
    }
});

router.post('/mailing-create', async (req, res) => {
    try {
        const mailingData = pick(req.body, [
            'title', 'organization', 'department', 
            'users', 'position', 'gender', 
            'date', 'channels'
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

router.post('/mailing-update/:id', validateId, async (req, res) => {
    try {
        const mailingData = pick(req.body, [
            'title', 'organization', 'department', 
            'users', 'position', 'gender', 
            'date', 'channels'
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
        const users = await User.getAll(filters);
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

        const existingMessage = await Messages.getById(req.validatedId);
        if (!existingMessage) {
            return res.status(404).json({ 
                error: 'Message not found'
            });
        }

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

module.exports = router;