import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FAQComponent = () => {
    const [faqList, setFaqList] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [category, setCategory] = useState('');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [error, setError] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        const fetchFAQ = async () => {
            try {
                const response = await axios.get('/api/faqs');
                setFaqList(response.data);
            } catch (error) {
                console.error('Error fetching FAQ:', error);
            }
        };

        fetchFAQ();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!question && !answer) {
            setError('Заполните все поля!');
            return;
        }

        try {
            if (selectedItem) {
                const response = await axios.post(`/api/faq/update/${selectedItem.id}`, {
                    category,
                    question,
                    answer
                });
                setFaqList(faqList.map(ch => 
                    ch.id === selectedItem.id ? response.data : ch
                ));
            } else {
                const response = await axios.post('/api/faq/create', {
                    category,
                    question,
                    answer
                });
                setFaqList([...faqList, response.data]);
            }

            resetForm();
            setError(null);
        } catch (err) {
            setError('Не удалось сохранить изменения');
            console.error('Error saving FAQ:', err);
        }
    };

    const handleSelect = (item) => {
        setSelectedItem(item);
        setCategory(item.category || '');
        setAnswer(item.answer || '');
        setQuestion(item.question || '');
    };

    const handleDelete = async (item) => {
        setItemToDelete(item);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`/api/faq/${itemToDelete.id}`);
            setFaqList(faqList.filter(ch => ch.id !== itemToDelete.id));
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            setError(null);
        } catch (err) {
            setError('Failed to delete faq');
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            console.error('Error deleting faq:', err);
        }
    };

    const resetForm = () => {
        setSelectedItem(null);
        setAnswer('');
        setQuestion('');
        setCategory('');
    };

    return (
        <div className="faq-manager">
            <div className="list">
                <div className="list__wrapper">
                    {faqList.map(faqItem => (
                        <div key={faqItem.id} className="list__item">
                            <div className="list__text">{faqItem.question}</div>
                            <div className="list__row">
                                <button
                                    className="list__button--left button button--blue"
                                    onClick={() => handleSelect(faqItem)}
                                >
                                    Выбрать
                                </button>
                                <button
                                    className="list__button--right button button--red"
                                    onClick={() => handleDelete(faqItem)}
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="control__wrapper">
                <div className="control__group">
                    <label className="control__label">
                        <span className="control__label--text">Категория:</span>
                        <input
                            className="control__input input"
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        />
                    </label>

                    <div className="tooltip tooltip--blue tooltip--bottom">
                        <span className="tooltip__text">
                            Задайте категорию вопроса.
                        </span>
                    </div>
                </div>

                <div className="control__group">
                    <label className="control__label">
                        <span className="control__label--text">Вопрос:</span>
                        <input
                            className="control__input input"
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                    </label>

                    <div className="tooltip tooltip--blue tooltip--bottom">
                        <span className="tooltip__text">
                            Введите один из часто задаваемых вопросов пользователей из данной категории.
                        </span>
                    </div>
                </div>

                <div className="control__group">
                    <label className="control__label">
                        <span className="control__label--text">Ответ:</span>
                        <textarea
                            className="control__input input"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            required
                        ></textarea>
                    </label>

                    <div className="tooltip tooltip--blue tooltip--bottom">
                        <span className="tooltip__text">
                            Задайте ответ на поставленный вопрос.
                        </span>
                    </div>
                </div>

                <div className="control__buttons">
                    <button
                        type="submit"
                        className="button button--green"
                    >
                        {selectedItem ? 'Обновить' : 'Добавить'}
                    </button>
                    {selectedItem && (
                        <button
                            type="button"
                            className="button button--gray"
                            onClick={resetForm}
                        >
                            Отменить
                        </button>
                    )}
                </div>

                {error && (
                    <div className="control__error">
                        {error}
                    </div>
                )}
            </form>

            {showDeleteConfirm && (
                <div className="modal">
                    <div className="modal__overlay" onClick={() => setShowDeleteConfirm(false)} />
                    <div className="modal__content">
                        <h3>Подтверждение удаления</h3>
                        <p>Вы уверены, что хотите удалить этот вопрос?</p>
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

export default FAQComponent;