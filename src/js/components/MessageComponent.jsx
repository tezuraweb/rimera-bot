import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NewsList from './NewsList';

const GROUPS = [
    { 
        id: 1, 
        title: 'Welcome Messages', 
        messageNames: [
            { name: 'welcome_message', title: 'Welcome Message' },
            { name: 'first_login', title: 'First Login Message' }
        ]
    },
    { 
        id: 2, 
        title: 'Notification Messages', 
        messageNames: [
            { name: 'news_notification', title: 'News Notification' },
            { name: 'event_reminder', title: 'Event Reminder' }
        ]
    },
];

const MessageComponent = () => {
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMessages();
    }, []);

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

    const handleNewsSelect = async (news) => {
        if (!selectedMessage) return;

        try {
            const messageData = {
                news: news.id
            };

            let updatedMessage;
            
            if (selectedMessage.id) {
                // Update existing message
                const response = await axios.post(`/api/message/update`, {
                    id: selectedMessage.id,
                    ...messageData
                });
                updatedMessage = response.data;
            } else {
                // Create new message
                const response = await axios.post(`/api/message/create`, {
                    name: selectedMessage.name,
                    title: selectedMessage.title,
                    group_id: selectedMessage.group_id,
                    ...messageData
                });
                updatedMessage = response.data;
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

    if (isLoading) return <div className="message-groups__loading">Loading messages...</div>;
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
                                    {message.news_text || 'Select news...'}
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
                            updateSelectedNews={handleNewsSelect}
                            isTemplate={true}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageComponent;