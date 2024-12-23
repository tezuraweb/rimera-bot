import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MailingItem from './MailingItem';

const MailingList = ({ updateSelectedMailing }) => {
    const [mailingList, setMailingList] = useState([]);

    useEffect(() => {
        const fetchMailing = async () => {
            try {
                const response = await axios.get('/api/mailing/list');
                setMailingList((prevMailingList) => [...prevMailingList, ...response.data]);
            } catch (error) {
                console.log('Ошибка при получении списка рассылок:', error);
            }
        };

        fetchMailing();
    }, []);

    const handleMailingSelect = (selectedMailing) => {
        updateSelectedMailing(selectedMailing);
    };

    return (
        <div class="list">
            <div class="list__wrapper">
                {mailingList.map((mailing) => (
                    <MailingItem key={mailing.id} mailing={mailing} onSelect={handleMailingSelect} />
                ))}
            </div>
        </div>
    );
};

export default MailingList;
