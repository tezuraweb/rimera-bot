import React, { useState } from 'react';
import NewsList from './NewsList';
import NewsControlPanel from './NewsControlPanel';

const NewsComponent = () => {
    const [selectedNews, setSelectedNews] = useState(null);

    const handleNewsSelect = (selectedNews) => {
        setSelectedNews(selectedNews);
    };

    return (
        <div class="news__wrapper">
            <NewsList updateSelectedNews={handleNewsSelect} />
            <NewsControlPanel selectedNews={selectedNews} />
        </div>
    );
};

export default NewsComponent;
