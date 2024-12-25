import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MailingItem from './MailingItem';

const MailingList = ({ updateSelectedMailing }) => {
    const [mailingList, setMailingList] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [error, setError] = useState(null);

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

    const handleDelete = async (item) => {
        setItemToDelete(item);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`/api/mailing/${itemToDelete.id}`);
            setMailingList(mailingList.filter(mailing => mailing.id !== itemToDelete.id));
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            setError(null);
        } catch (err) {
            setError('Не удалось удалить рассылку');
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            console.error('Error deleting mailing:', err);
        }
    };

    return (
        <div class="list">
            <div class="list__wrapper">
                {mailingList.map((mailing) => (
                    <MailingItem key={mailing.id} mailing={mailing} onSelect={handleMailingSelect} onDelete={handleDelete} />
                ))}

                {error && (
                    <div className="control__error">
                        {error}
                    </div>
                )}
            </div>

            {showDeleteConfirm && (
                <div className="modal">
                    <div className="modal__overlay" onClick={() => setShowDeleteConfirm(false)} />
                    <div className="modal__content">
                        <h3>Подтверждение удаления</h3>
                        <p>Вы уверены, что хотите удалить эту рассылку?</p>
                        <div className="modal__buttons">
                            <button
                                className="button button--red"
                                onClick={confirmDelete}
                            >
                                Удалить
                            </button>
                            <button
                                className="button button--gray button--right"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MailingList;
