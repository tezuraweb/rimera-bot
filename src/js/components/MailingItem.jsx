import React from 'react';

const MailingItem = ({ mailing, onSelect, onDelete }) => {
    return (
        <div class="list__item">
            <div class="list__text">{mailing.name}</div>
            <div class="list__row">
                {onSelect && (
                    <button
                        class="list__button--left button button--blue"
                        onClick={() => onSelect(mailing)}
                    >
                        Выбрать
                    </button>
                )}
                {onDelete && (
                    <button
                        className="list__button--right button button--red"
                        onClick={() => onDelete(mailing)}
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
};

export default MailingItem;
