import React from 'react';

const NewsItem = ({ news, onSelect }) => {
    const handleSelect = () => {
        onSelect(news);
    };

    return (
        <div class="list__item">
            <div class="list__text">{news.text}</div>
            <div class="list__row">
                <div class="list__link">
                    <a class="link" href={'https://t.me/' + news.username} target='_blank' rel='nofollow noopener'>{'@' + news.username}</a>
                </div>
                
                <button class="list__button--right button" onClick={handleSelect}>Выбрать</button>
            </div>
            
        </div>
    );
};

export default NewsItem;
