import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NewsList from './NewsList';
import AppealControlPanel from './AppealControlPanel';
import OrganizationSelection from './OrganizationSelection';
import ModalDelete from './ModalDelete';

const types = {
    appeal_feature: 'Предложение по улучшению',
    appeal_problem: 'Сообщение о проблеме',
    appeal_security: 'Вопрос по безопасности',
    appeal_ceo: 'Обращение к руководству',
    appeal_hr: 'Вопрос по трудоустройству',
    appeal_labour: 'Вопрос по охране труда',
    appeal_youth: 'Совет молодежи',
    appeal_medroom: 'Медпункт',
    appeal_salary: 'Заработная плата и расчеты',
    appeal_workplace: 'Обслуживание рабочего места',
};

const AppealComponent = () => {
    const [selectedAppeal, setSelectedAppeal] = useState(null);
    const [activeTab, setActiveTab] = useState('new');
    const [appealList, setAppealList] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [error, setError] = useState(null);

    const limit = 10;

    useEffect(() => {
        const fetchAppeals = async () => {
            try {
                const response = await axios.get(`/api/appeals`, {
                    params: {
                        page,
                        limit,
                        isResponded: activeTab === 'archive',
                    }
                });

                const { data, total } = response.data;
                setAppealList(prev => [...prev, ...data.map(appeal => ({
                    ...appeal,
                    type: types[appeal.type]
                }))]);
                setHasMore(appealList.length + data.length < total);
            } catch (error) {
                console.error('Error fetching appeals:', error);
            }
        };

        fetchAppeals();
    }, [page, activeTab]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setAppealList([]);
        setPage(1);
        setHasMore(true);
        setSelectedAppeal(null);
    };

    const loadMore = () => {
        setPage(prev => prev + 1);
    };

    const handleAppealUpdate = () => {
        setAppealList((prev) => prev.filter(appeal => appeal.id !== selectedAppeal.id));
        setSelectedAppeal(null);
    };

    const handleDelete = async (item) => {
        setItemToDelete(item);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`/api/appeal/${itemToDelete.id}`);
            setSelectedAppeal(null);
            setAppealList(appealList.filter(appeal => appeal.id !== itemToDelete.id));
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            setError(null);
        } catch (err) {
            setError('Не удалось удалить обращение');
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            console.error('Error deleting appeal:', err);
        }
    };

    return (
        <div className="news__wrapper">
            <div className="news__tabs">
                <button
                    className={`news__tab ${activeTab === 'new' ? 'active' : ''}`}
                    onClick={() => handleTabChange("new")}
                >
                    Новые обращения
                </button>
                <button
                    className={`news__tab ${activeTab === 'archive' ? 'active' : ''}`}
                    onClick={() => handleTabChange("archive")}
                >
                    Архив
                </button>
            </div>

            <NewsList
                newsList={appealList}
                onNewsSelect={setSelectedAppeal}
                onNewsDelete={(activeTab === 'archive') ? handleDelete : null}
                hasMore={hasMore}
                isAppeal={true}
                onLoadMore={loadMore}
            />

            {error && (
                <div className="control__error">
                    {error}
                </div>
            )}

            {selectedAppeal && (
                <AppealControlPanel
                    selectedAppeal={selectedAppeal}
                    onAppealUpdate={handleAppealUpdate}
                />
            )}

            <OrganizationSelection />

            {showDeleteConfirm && (
                <ModalDelete
                    text={'Вы уверены, что хотите удалить это обращение?'}
                    setShowDeleteConfirm={setShowDeleteConfirm}
                    confirmDelete={confirmDelete}
                />
            )}
        </div>
    );
};

export default AppealComponent;
