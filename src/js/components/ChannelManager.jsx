import React, { useState } from 'react';
import axios from 'axios';

const ChannelManager = ({ channels, onChannelsUpdate }) => {
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [name, setName] = useState('');
    const [link, setLink] = useState('');
    const [error, setError] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [channelToDelete, setChannelToDelete] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!link) {
            setError('Link is required');
            return;
        }

        try {
            if (selectedChannel) {
                const response = await axios.post(`/api/channel/update/${selectedChannel.id}`, {
                    link,
                    name
                });
                onChannelsUpdate(channels.map(ch => 
                    ch.id === selectedChannel.id ? response.data : ch
                ));
            } else {
                const response = await axios.post('/api/channel/create', {
                    link,
                    name
                });
                onChannelsUpdate([...channels, response.data]);
            }

            resetForm();
            setError(null);
        } catch (err) {
            setError('Failed to save channel');
            console.error('Error saving channel:', err);
        }
    };

    const handleSelect = (channel) => {
        setSelectedChannel(channel);
        setName(channel.name || '');
        setLink(channel.link || '');
    };

    const handleDelete = async (channel) => {
        setChannelToDelete(channel);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`/api/channel/${channelToDelete.id}`);
            onChannelsUpdate(channels.filter(ch => ch.id !== channelToDelete.id));
            setShowDeleteConfirm(false);
            setChannelToDelete(null);
            setError(null);
        } catch (err) {
            setError('Failed to delete channel');
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            console.error('Error deleting channel:', err);
        }
    };

    const resetForm = () => {
        setSelectedChannel(null);
        setName('');
        setLink('');
    };

    return (
        <div className="channel-manager">
            <h2 className="control__title">Каналы Telegram</h2>

            <div className="list">
                <div className="list__wrapper">
                    {channels.map(channel => (
                        <div key={channel.id} className="list__item">
                            <div className="list__text">{channel.name || channel.link}</div>
                            <div className="list__row">
                                <button 
                                    className="list__button--left button button--blue" 
                                    onClick={() => handleSelect(channel)}
                                >
                                    Выбрать
                                </button>
                                <button 
                                    className="list__button--right button button--red" 
                                    onClick={() => handleDelete(channel)}
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="control__wrapper">
                <div className="control__group">
                    <label className="control__label">
                        <span className="control__label--text">Название:</span>
                        <input
                            className="control__input input"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Название канала"
                        />
                    </label>

                    <div className="tooltip tooltip--blue tooltip--bottom">
                        <span className="tooltip__text">
                            Название канала для удобства идентификации
                        </span>
                    </div>
                </div>

                <div className="control__group">
                    <label className="control__label">
                        <span className="control__label--text">Ссылка:</span>
                        <input
                            className="control__input input"
                            type="text"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://t.me/channel"
                            required
                        />
                    </label>

                    <div className="tooltip tooltip--blue tooltip--bottom">
                        <span className="tooltip__text">
                            Ссылка на Telegram канал
                        </span>
                    </div>
                </div>

                <div className="control__buttons">
                    <button 
                        type="submit" 
                        className="button button--green"
                    >
                        {selectedChannel ? 'Обновить' : 'Добавить'} канал
                    </button>
                    {selectedChannel && (
                        <button 
                            type="button"
                            className="button button--gray"
                            onClick={resetForm}
                        >
                            Отменить
                        </button>
                    )}
                </div>

                {error && (
                    <div className="control__error">
                        {error}
                    </div>
                )}
            </form>

            {showDeleteConfirm && (
                <div className="modal">
                    <div className="modal__overlay" onClick={() => setShowDeleteConfirm(false)} />
                    <div className="modal__content">
                        <h3>Подтверждение удаления</h3>
                        <p>Вы уверены, что хотите удалить этот канал?</p>
                        <div className="modal__buttons">
                            <button 
                                className="button button--red"
                                onClick={confirmDelete}
                            >
                                Удалить
                            </button>
                            <button 
                                className="button button--gray button--right"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChannelManager;