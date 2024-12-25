import React from 'react';

const NewsItem = ({ news, onSelect, onDelete, isTemplate = false, isAppeal = false }) => {
    return (
        <div class="list__item">
            <div class="list__text">{news.text}</div>
            {(isAppeal) && (
                <div class="list__row">
                    {news.type && (
                        <div class="list__link">{news.type}: </div>
                    )}

                    {news.orgname && (
                        <div class="list__link">{news.orgname}</div>
                    )}
                </div>
            )}

            <div class="list__row">
                {news.username && (
                    <div class="list__link">
                        <a class="link" href={'https://t.me/' + news.username} target='_blank' rel='nofollow noopener'>{'@' + news.username}</a>
                    </div>
                )}

                {onSelect && (
                    <button
                        class="list__button--right button button--green"
                        onClick={() => onSelect(news)}
                    >
                        {isAppeal ? 'Ответить' : (isTemplate ? 'Выбрать' : 'Редактировать')}
                    </button>
                )}

                {onDelete && (
                    <button
                        className="list__button--right button button--red"
                        onClick={() => onDelete(news)}
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
};

export default NewsItem;
