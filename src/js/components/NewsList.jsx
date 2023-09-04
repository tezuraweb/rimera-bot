import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NewsItem from './NewsItem';

const NewsList = ({ updateSelectedNews }) => {
    const [newsList, setNewsList] = useState([]);
    const [page, setPage] = useState(1);
    const [newsCount, setNewsCount] = useState(0);
    const limit = 5;

    useEffect(() => {
        const fetchTotalNews = async () => {
            try {
                const response = await axios.get('/api/news-count');
                const count = parseInt(response.data.count);
                setNewsCount(count);
            } catch (error) {
                console.log('Ошибка при получении числа новостей:', error);
            }
        };

        fetchTotalNews();
    }, []);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await axios.get(`/api/news?page=${page}&limit=${limit}`);
                setNewsList((prevNewsList) => [...prevNewsList, ...response.data]);
            } catch (error) {
                console.log('Ошибка при получении списка новостей:', error);
            }
        };

        fetchNews();
    }, [page]);

    const loadMoreNews = () => {
        setPage((prevPage) => prevPage + 1);
    };

    const handleNewsSelect = (selectedNews) => {
        updateSelectedNews(selectedNews);
    };

    return (
        <div class="list">
            <div class="list__wrapper">
                {newsList.map((news, index) => (
                    <NewsItem key={index} news={news} onSelect={handleNewsSelect} />
                ))}
            </div>
            
            {newsList.length < newsCount && (
                <button class="list__button button button--green" onClick={loadMoreNews}>Загрузить еще новости</button>
            )}
        </div>
    );
};

export default NewsList;
