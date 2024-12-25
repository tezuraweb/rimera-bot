import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NewsList from './NewsList';
import NewsControlPanel from './NewsControlPanel';
import ChannelManager from './ChannelManager';
import ModalDelete from './ModalDelete';

const NewsComponent = () => {
    const [selectedNews, setSelectedNews] = useState(null);
    const [activeTab, setActiveTab] = useState('news');
    const [newsList, setNewsList] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [channels, setChannels] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [error, setError] = useState(null);

    const handleDelete = async (item) => {
        setItemToDelete(item);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`/api/news/${itemToDelete.id}`);
            setSelectedNews(null);
            setNewsList(newsList.filter(news => news.id !== itemToDelete.id));
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            setError(null);
        } catch (err) {
            if (err.response?.data?.type === 'has_relations') {
                setError('Невозможно удалить сообщение, которое используется в статичных рассылках. Пожалуйста, сначала замените сообщение в статичной рассылке.');
            } else {
                setError('Не удалось удалить сообщение');
            }
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            console.error('Error deleting news:', err);
        }
    };

    const limit = 10;

    // Fetch news data at the top level
    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await axios.get(`/api/news`, {
                    params: {
                        page,
                        limit,
                        isTemplate: activeTab === 'templates',
                        isPublished: activeTab === 'archive',
                    }
                });

                const { data, total } = response.data;
                setNewsList(prev => [...prev, ...data]);
                setHasMore(newsList.length + data.length < total);
            } catch (error) {
                console.error('Error fetching news:', error);
            }
        };

        fetchNews();
    }, [page, activeTab]);

    // Fetch channels once at component mount
    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const response = await axios.get('/api/channels');
                setChannels(response.data);
            } catch (error) {
                console.error('Error fetching channels:', error);
            }
        };

        fetchChannels();
    }, []);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setNewsList([]);
        setPage(1);
        setHasMore(true);
        setSelectedNews(null);
    };

    const handleNewsPublish = () => {
        setNewsList((prev) => prev.filter(news => news.id !== selectedNews.id));
        setSelectedNews(null);
    };

    const loadMoreNews = () => {
        setPage(prev => prev + 1);
    };

    return (
        <div className="news__wrapper">
            <div className="news__tabs">
                <button
                    className={`news__tab ${activeTab === 'news' ? 'active' : ''}`}
                    onClick={() => handleTabChange("news")}
                >
                    Новости
                </button>
                <button
                    className={`news__tab ${activeTab === 'templates' ? 'active' : ''}`}
                    onClick={() => handleTabChange("templates")}
                >
                    Шаблоны
                </button>
                <button
                    className={`news__tab ${activeTab === 'archive' ? 'active' : ''}`}
                    onClick={() => handleTabChange("archive")}
                >
                    Архив
                </button>
            </div>

            <NewsList
                newsList={newsList}
                onNewsSelect={setSelectedNews}
                onNewsDelete={handleDelete}
                isTemplate={activeTab === "templates"}
                hasMore={hasMore}
                onLoadMore={loadMoreNews}
            />

            {error && (
                <div className="control__error">
                    {error}
                </div>
            )}

            {selectedNews && (
                <NewsControlPanel
                    selectedNews={selectedNews}
                    channels={channels}
                    onNewsUpdate={(updatedNews) => {
                        setNewsList(prev =>
                            prev.map(news =>
                                news.id === updatedNews.id ? updatedNews : news
                            )
                        );
                    }}
                    onNewsPublish={handleNewsPublish}
                />
            )}

            <ChannelManager
                channels={channels}
                onChannelsUpdate={setChannels}
            />

            {showDeleteConfirm && (
                <ModalDelete
                    text={'Вы уверены, что хотите удалить это сообщение?'}
                    setShowDeleteConfirm={setShowDeleteConfirm}
                    confirmDelete={confirmDelete}
                />
            )}
        </div>
    );
};

export default NewsComponent;
