import React from 'react';

const NewsItem = ({ news, onSelect, isTemplate = false }) => {
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
                
                <button class="list__button--right button button--green" onClick={handleSelect}>{isTemplate ? 'Выбрать' : 'Редактировать'}</button>
            </div>
            
        </div>
    );
};

export default NewsItem;
