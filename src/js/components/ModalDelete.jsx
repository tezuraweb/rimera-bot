import React from 'react';

const NewsItem = ({ text = 'Удалить?', setShowDeleteConfirm, confirmDelete }) => {
    return (
        <div className="modal">
            <div className="modal__overlay" onClick={() => setShowDeleteConfirm(false)} />
            <div className="modal__content">
                <h3>Подтверждение удаления</h3>
                <p>{text}</p>
                <div className="modal__buttons">
                    <button
                        className="button button--red"
                        onClick={() => confirmDelete()}
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
    );
};

export default NewsItem;