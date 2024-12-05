import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NewsItem from './NewsItem';

const NewsList = ({ updateSelectedNews, isTemplate }) => {
    const [newsList, setNewsList] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const limit = 5;

    useEffect(() => {
        setNewsList([]);
        setPage(1);
        setHasMore(true);
    }, [isTemplate]);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await axios.get(`/api/news`, {
                    params: {
                        page,
                        limit,
                        isTemplate
                    }
                });
                
                const { data, total } = response.data;
                setNewsList((prevNewsList) => [...prevNewsList, ...data]);
                setHasMore(newsList.length + data.length < total);
            } catch (error) {
                console.error('Error fetching news:', error);
            }
        };

        fetchNews();
    }, [page, isTemplate]);

    const loadMoreNews = () => {
        setPage((prevPage) => prevPage + 1);
    };

    const handleNewsSelect = (selectedNews) => {
        updateSelectedNews(selectedNews);
    };

    return (
        <div className="list">
            <div className="list__wrapper">
                {newsList.map((news) => (
                    (isTemplate ? (
                        <NewsItem
                            key={news.id}
                            news={news}
                            onSelect={handleNewsSelect}
                            isTemplate={isTemplate}
                        />
                    ) : (
                        <NewsItem
                            key={news.id}
                            news={news}
                            onSelect={handleNewsSelect}
                        />
                    ))
                ))}
            </div>

            {hasMore && (
                <button
                    className="list__button button button--green"
                    onClick={loadMoreNews}
                >
                    Загрузить еще новости
                </button>
            )}
        </div>
    );
};

export default NewsList;