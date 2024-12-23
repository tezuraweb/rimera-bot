import React, { useEffect, useState } from 'react';
import axios from 'axios';

const NewsControlPanel = ({ selectedNews, channels, onNewsUpdate, onNewsPublish }) => {
    const [newsText, setNewsText] = useState('');
    const [newsChanged, setNewsChanged] = useState(false);
    const [newsUpdated, setNewsUpdated] = useState(false);
    const [newsPublished, setNewsPublished] = useState(false);
    const [selectedChannels, setSelectedChannels] = useState(new Set());
    const [newsChannelRelations, setNewsChannelRelations] = useState([]);
    const [files, setFiles] = useState([]);

    useEffect(() => {
        if (selectedNews !== null) {
            setNewsText(selectedNews.text);
            if (!selectedNews.template) {
                fetchNewsChannelRelation(selectedNews.id);
            }
            fetchFiles(selectedNews.id);
        }
    }, [selectedNews]);

    useEffect(() => {
        const updateNews = async () => {
            try {
                await axios.post(`api/news/update/${selectedNews.id}`, {
                    'text': newsText
                });

                if (!selectedNews.template) {
                    const relationsToDelete = newsChannelRelations.filter(
                        relation => !selectedChannels.has(relation.channel_id)
                    );

                    const newChannelIds = [...selectedChannels].filter(channelId =>
                        !newsChannelRelations.some(relation => relation.channel_id === channelId)
                    );

                    if (relationsToDelete.length > 0) {
                        await axios.post('api/news-channel/delete-multiple', {
                            ids: relationsToDelete.map(relation => relation.id)
                        });
                    }

                    if (newChannelIds.length > 0) {
                        await axios.post('api/news-channel/insert-multiple', {
                            newsId: selectedNews.id,
                            channelIds: newChannelIds
                        });
                    }

                    await fetchNewsChannelRelation(selectedNews.id);
                }

                setNewsChanged(false);
                setNewsUpdated(false);

                if (onNewsUpdate) {
                    onNewsUpdate(selectedNews.id);
                }

            } catch (error) {
                console.error('Error updating news:', error);
            }
        };

        if (newsUpdated) {
            updateNews();
        }
    }, [newsUpdated]);

    useEffect(() => {
        const publish = async () => {
            try {
                await axios.post(`api/news/publish/${selectedNews.id}`);

                setNewsChanged(false);
                newsPublished(false);

                if (onNewsPublish) {
                    onNewsPublish();
                }

            } catch (error) {
                console.error('Error updating news:', error);
            }
        };

        if (newsPublished && !newsChanged) {
            publish();
        }
    }, [newsPublished]);

    const fetchNewsChannelRelation = async (newsId) => {
        try {
            const response = await axios.get(`api/news-channel/${newsId}`);
            setNewsChannelRelations(response.data);
            setSelectedChannels(new Set(response.data.map(relation => relation.channel_id)));
        } catch (error) {
            console.error('Error fetching news-channel relations:', error);
        }
    };

    const fetchFiles = async (newsId) => {
        try {
            const response = await axios.get(`api/files/news/${newsId}`);
            if (response?.data?.length > 0) {
                setFiles(response.data);
            } else {
                setFiles([]);
            }
        } catch (error) {
            console.error('Error fetching news files:', error);
        }
    };

    const toggleChannel = (channelId) => {
        setSelectedChannels(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(channelId)) {
                newSelection.delete(channelId);
            } else {
                newSelection.add(channelId);
            }
            return newSelection;
        });
        setNewsChanged(true);
    };

    const submitForm = (e) => {
        e.preventDefault();
        setNewsUpdated(true);
    };

    const publishNews = (e) => {
        e.preventDefault();
        setNewsPublished(true);
    };

    return (
        <div className="control">
            {selectedNews && (
                <form className="control__form" onSubmit={submitForm}>
                    <h2 className="control__title">Редактор новостей</h2>
                    <div className="control__wrapper">
                        <div className="control__link">
                            <span>Автор: </span>
                            <a
                                className="link"
                                href={`https://t.me/${selectedNews.username}`}
                                target='_blank'
                                rel='nofollow noopener'
                            >
                                @{selectedNews.username}
                            </a>

                            {!selectedNews.template && <div className="filter__active">
                                {channels.map((channel) => (
                                    <div
                                        className={`filter__active--item ${selectedChannels.has(channel.id) ? 'active' : ''}`}
                                        key={channel.id}
                                        onClick={() => toggleChannel(channel.id)}
                                    >
                                        <div className="filter__active--text">
                                            <span>{channel.name}</span>
                                            <span> (@{channel.link})</span>
                                        </div>
                                    </div>
                                ))}
                            </div>}

                            <div className="control__description">
                                Текст новости:
                                <div className="tooltip tooltip--green">
                                    <span className="tooltip__text">
                                        Вы можете отредактировать текст новости, для этого кликните в поле ниже и начните вводить текст.
                                        Затем кликните по кнопке "Сохранить". После сохранения выйдите из панели администратора и
                                        опубликуйте ваши новости через бота.
                                    </span>
                                </div>
                            </div>
                        </div>

                        <textarea
                            className="control__text"
                            cols="50"
                            rows="8"
                            value={newsText}
                            onChange={(event) => {
                                setNewsText(event.target.value);
                                setNewsChanged(true);
                            }}
                        />

                        {files?.length > 0 && (
                            <div className="control__images flex">
                                {files.map((file, index) => (
                                    (file.type === 'photo' ? <div className="control__images--item flex-item" key={index}>
                                        <img src={`/api/tg/image/${file.file_id}`} alt="img" />
                                    </div> : null)
                                ))}
                            </div>
                        )}

                        {newsChanged && (
                            <button className="control__button button button--green" type="submit">
                                Сохранить
                            </button>
                        )}

                        {(!newsChanged && !newsUpdated) && (
                            <button className="control__button button button--green" type="button" onClick={publishNews}>
                                Опубликовать
                            </button>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
};

export default NewsControlPanel;