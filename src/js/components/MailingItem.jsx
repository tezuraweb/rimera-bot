import React from 'react';

const MailingItem = ({ mailing, onSelect }) => {
    const handleSelect = () => {
        onSelect(mailing);
    };

    return (
        <div class="list__item">
            <div class="list__text">{mailing.name}</div>
            <div class="list__row">
                <button class="list__button--left button button--blue" onClick={handleSelect}>Выбрать</button>
            </div>
        </div>
    );
};

export default MailingItem;
