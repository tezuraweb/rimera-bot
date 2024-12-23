import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AppealControlPanel = ({ selectedAppeal, onAppealUpdate }) => {
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [files, setFiles] = useState([]);

    useEffect(() => {
        if (selectedAppeal !== null) {
            fetchFiles(selectedAppeal.id);
        }
    }, [selectedAppeal]);

    const submitForm = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        setSubmitting(true);
        try {
            await axios.post(`api/appeal/reply/${selectedAppeal.id}`, {
                text: replyText
            });

            setReplyText('');

            if (onAppealUpdate) {
                onAppealUpdate(selectedAppeal.id);
            }
        } catch (error) {
            console.error('Error submitting reply:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const fetchFiles = async (newsId) => {
        try {
            const response = await axios.get(`api/files/appeal/${newsId}`);
            if (response?.data?.length > 0) {
                setFiles(response.data);
            } else {
                setFiles([]);
            }
        } catch (error) {
            console.error('Error fetching appeal files:', error);
        }
    };

    return (
        <div className="control">
            {selectedAppeal && (
                <div className="control__form">
                    <h2 className="control__title">Просмотр обращения</h2>
                    <div className="control__wrapper">
                        <div className="control__link">
                            <div className="control__info">
                                <span>Автор: </span>
                                <a
                                    className="link"
                                    href={`https://t.me/${selectedAppeal.username}`}
                                    target='_blank'
                                    rel='nofollow noopener'
                                >
                                    @{selectedAppeal.username}
                                </a>
                            </div>

                            <div className="control__info">
                                <span>Организация: </span>
                                <span>{selectedAppeal.orgname}</span>
                            </div>

                            <div className="control__info">
                                <span>Тип обращения: </span>
                                <span>{selectedAppeal.type}</span>
                            </div>

                            <div className="control__description">
                                Текст обращения:
                            </div>
                        </div>

                        <div className="control__text-display">
                            {selectedAppeal.text}
                        </div>

                        {files?.length > 0 && (
                            <div className="control__images flex">
                                {files.map((file, index) => (
                                    (file.type === 'photo' ? <div className="control__images--item flex-item" key={index}>
                                        <img src={`/api/tg/image/${file.file_id}`} alt="img" />
                                    </div> : null)
                                ))}
                            </div>
                        )}

                        <form onSubmit={submitForm} className="control__reply">
                            <div className="control__description">
                                Ответ на обращение:
                                <div className="tooltip tooltip--green">
                                    <span className="tooltip__text">
                                        Введите текст ответа на обращение. После отправки ответ будет доставлен пользователю через бота.
                                    </span>
                                </div>
                            </div>

                            <textarea
                                className="control__text"
                                cols="50"
                                rows="8"
                                value={replyText}
                                onChange={(event) => setReplyText(event.target.value)}
                                placeholder="Введите ваш ответ..."
                            />

                            {replyText.trim() && (
                                <button
                                    className="control__button button button--green"
                                    type="submit"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Отправка...' : 'Отправить ответ'}
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppealControlPanel;