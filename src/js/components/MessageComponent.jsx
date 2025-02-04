import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NewsList from './NewsList';

const GROUPS = [
    {
        id: 1,
        title: 'Приветственная рассылка',
        messageNames: [
            { name: 'greeting_welcome', title: 'Первое приветствие' },
            { name: 'greeting_info', title: 'Информация' },
            { name: 'greeting_request_phone', title: 'Просьба отправить телефон' },
            { name: 'greeting_not_found', title: 'Пользователь не найден' },
            { name: 'greeting_subscribe', title: 'Просьба подписаться на каналы' },
            { name: 'greeting_remind1', title: 'Напоминание о подписке на каналы 1' },
            { name: 'greeting_remind2', title: 'Напоминание о подписке на каналы 2' },
            { name: 'greeting_deny', title: 'Отказ в допуске, напоминание о подписке' },
            { name: 'greeting_goto_menu', title: 'Допуск разрешен, добро пожаловать' },
        ]
    },
    {
        id: 2,
        title: 'Обращения пользователей',
        messageNames: [
            { name: 'appeal_feature', title: 'Подать рацпредложение' },
            { name: 'appeal_problem', title: 'Сообщить о проблеме' },
            { name: 'appeal_contacts', title: 'Контакты' },
            { name: 'appeal_security', title: 'Служба безопасности' },
            { name: 'appeal_ceo', title: 'Приемная исполнительного директора' },
            { name: 'appeal_hr', title: 'Дирекция по персоналу' },
            { name: 'appeal_labour', title: 'Охрана труда' },
            { name: 'appeal_youth', title: 'Совет молодежи' },
            { name: 'appeal_medroom', title: 'Медпункт' },
            { name: 'appeal_salary', title: 'Заработная плата и расчеты' },
            { name: 'appeal_workplace', title: 'Обслуживание рабочего места' },
        ]
    },
    {
        id: 3,
        title: 'Знакомство с компанией',
        messageNames: [
            { name: 'company_intro', title: 'Входное сообщение' },
            { name: 'company_mission', title: 'Миссия' },
            { name: 'company_values', title: 'Ценности' },
            { name: 'company_code', title: 'Кодекс' },
            { name: 'company_info', title: 'Информация' },
        ]
    },
    {
        id: 4,
        title: 'Разделы новостей',
        messageNames: [
            { name: 'news_digest', title: 'Вход в дайджест' },
            { name: 'news_course', title: 'Курс Римеры' },
            { name: 'news_intro', title: 'Вход в предложку' },
        ]
    },
    {
        id: 5,
        title: 'Часто задаваемые вопросы',
        messageNames: [
            { name: 'faq_intro', title: 'Входное сообщение' },
        ]
    },
    {
        id: 6,
        title: 'Вакансии',
        messageNames: [
            { name: 'vacancies_intro', title: 'Входное сообщение' },
        ]
    },
];

const MessageComponent = () => {
    const [messages, setMessages] = useState([]);
    const [newsList, setNewsList] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMessages();
    }, []);

    useEffect(() => {
        fetchNews();
    }, [selectedMessage]);

    const fetchMessages = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get('/api/messages');
            setMessages(response.data);
        } catch (err) {
            setError('Failed to fetch messages');
            console.error('Error fetching messages:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchNews = async () => {
        if (!selectedMessage) return;

        try {
            const response = await axios.get(`/api/news/all`, {
                params: {
                    isTemplate: true
                }
            });

            const data = response.data;
            setNewsList(data);
        } catch (error) {
            console.error('Error fetching news:', error);
        }
    };

    const handleNewsSelect = async (news) => {
        if (!selectedMessage) return;

        try {
            let updatedMessage;

            if (selectedMessage.id) {
                const response = await axios.post(`/api/message/update/${selectedMessage.id}`, {
                    news: news.id
                });
                updatedMessage = response.data;
                updatedMessage.news_text = news.text;
            } else {
                const response = await axios.post(`/api/message/create`, {
                    name: selectedMessage.name,
                    title: selectedMessage.title,
                    group_id: selectedMessage.group_id,
                    news: news.id
                });
                updatedMessage = response.data;
                updatedMessage.news_text = news.text;
            }

            setMessages(prevMessages => {
                const messageExists = prevMessages.some(msg => msg.name === updatedMessage.name);
                if (messageExists) {
                    return prevMessages.map(msg =>
                        msg.name === updatedMessage.name ? updatedMessage : msg
                    );
                } else {
                    return [...prevMessages, updatedMessage];
                }
            });

            setIsNewsDialogOpen(false);
            setSelectedMessage(null);
        } catch (err) {
            console.error('Error updating message:', err);
        }
    };

    const groupedMessages = GROUPS.map(group => {
        const configuredMessages = group.messageNames.map(configMsg => {
            const existingMessage = messages.find(msg => msg.name === configMsg.name);
            return existingMessage || {
                name: configMsg.name,
                title: configMsg.title,
                group_id: group.id,
                news_text: null
            };
        });

        return {
            ...group,
            messages: configuredMessages
        };
    });

    if (isLoading) return <div className="message-groups__loading">Загружаем сообщения...</div>;
    if (error) return <div className="message-groups__error">{error}</div>;

    return (
        <div className="message-groups">
            {groupedMessages.map(group => (
                <div key={group.id} className="message-group">
                    <h2 className="message-group__title">{group.title}</h2>
                    <div className="message-group__content">
                        {group.messages.map(message => (
                            <div key={message.name} className="message-item">
                                <span className="message-item__title">{message.title}</span>
                                <button
                                    onClick={() => {
                                        setSelectedMessage(message);
                                        setIsNewsDialogOpen(true);
                                    }}
                                    className="message-item__button"
                                >
                                    {message.news_text || 'Выбрать сообщение...'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {isNewsDialogOpen && (
                <div className="modal">
                    <div className="modal__overlay" onClick={() => setIsNewsDialogOpen(false)} />
                    <div className="modal__content">
                        <button
                            className="modal__close"
                            onClick={() => setIsNewsDialogOpen(false)}
                        >
                            ×
                        </button>
                        <NewsList
                            newsList={newsList}
                            onNewsSelect={handleNewsSelect}
                            isTemplate={true}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageComponent;