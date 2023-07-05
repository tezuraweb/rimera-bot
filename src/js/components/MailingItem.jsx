import React from 'react';

const MailingItem = ({ mailing, onSelect }) => {
    const handleSelect = () => {
        onSelect(mailing);
    };

    return (
        <div class="list__item">
            <div class="list__text">{mailing.name}</div>
            <button class="list__button--right button" onClick={handleSelect}>Выбрать</button>
        </div>
    );
};

export default MailingItem;
