import React from 'react';
import NewsItem from './NewsItem';

const NewsList = ({ 
    newsList, 
    onNewsSelect, 
    isTemplate,
    isAppeal,
    hasMore, 
    onLoadMore
}) => {
    return (
        <div className="list">
            <div className="list__wrapper">
                {newsList.map((news) => (
                    <NewsItem
                        key={news.id}
                        news={news}
                        onSelect={onNewsSelect}
                        isTemplate={isTemplate}
                        isAppeal={isAppeal}
                    />
                ))}
            </div>

            {hasMore && (
                <button
                    className="list__button button button--green"
                    onClick={onLoadMore}
                >
                    Загрузить еще
                </button>
            )}
        </div>
    );
};

export default NewsList;