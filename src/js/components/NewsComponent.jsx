import React, { useState } from 'react';
import NewsList from './NewsList';
import NewsControlPanel from './NewsControlPanel';

const NewsComponent = () => {
    const [selectedNews, setSelectedNews] = useState(null);
    const [activeTab, setActiveTab] = useState('news');

    const handleNewsSelect = (selectedNews) => {
        setSelectedNews(selectedNews);
    };

    return (
        <div className="news__wrapper">
            <div className="news__tabs">
                <button className="news__tab" onClick={() => setActiveTab("news")}>Новости</button>
                <button className="news__tab" onClick={() => setActiveTab("templates")}>Шаблоны</button>
            </div>
            <NewsList 
                updateSelectedNews={handleNewsSelect} 
                isTemplate={!!(activeTab === "templates")} 
            />
            <NewsControlPanel selectedNews={selectedNews} />
        </div>
    );
};

export default NewsComponent;
