import React, { useState } from 'react';
import MailingList from './MailingList';
import MailingControlPanel from './MailingControlPanel';

const MailingComponent = () => {
    const [selectedMailing, setSelectedMailing] = useState(null);
    const [selectedMailingKey, setSelectedMailingKey] = useState(-1);

    const handleMailingSelect = (mailing) => {
        setSelectedMailing(mailing);
        setSelectedMailingKey(mailing.id);
    };

    const createNewMiling = () => {
        setSelectedMailing(null);
        setSelectedMailingKey(-1);
    };

    return (
        <div class="mailing__wrapper">
            <MailingList updateSelectedMailing={handleMailingSelect} />
            <button class="list__button list__button--outer button" onClick={createNewMiling}>Создать новую рассылку</button>
            <MailingControlPanel key={selectedMailingKey} selectedMailing={selectedMailing} />
        </div>
    );
};

export default MailingComponent;