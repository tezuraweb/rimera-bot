import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NewsList from './NewsList';
import AppealControlPanel from './AppealControlPanel';
import OrganizationSelection from './OrganizationSelection';

const types = {
    appeal_feature: 'Предложение по улучшению',
    appeal_problem: 'Сообщение о проблеме',
    appeal_security: 'Вопрос по безопасности',
    appeal_ceo: 'Обращение к руководству',
    appeal_hr: 'Вопрос по трудоустройству',
    appeal_labour: 'Вопрос по охране труда'
};

const AppealComponent = () => {
    const [selectedAppeal, setSelectedAppeal] = useState(null);
    const [activeTab, setActiveTab] = useState('new');
    const [appealList, setAppealList] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
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
        setAppealList([]);
        setPage(1);
        setSelectedAppeal(null);
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
                hasMore={hasMore}
                isAppeal={true}
                onLoadMore={loadMore}
            />
            {selectedAppeal && (
                <AppealControlPanel
                    selectedAppeal={selectedAppeal}
                    onAppealUpdate={handleAppealUpdate}
                />
            )}
            <OrganizationSelection />
        </div>
    );
};

export default AppealComponent;
