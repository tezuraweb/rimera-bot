import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OrganizationSelection = () => {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        try {
            const response = await axios.get('/api/organizations');

            setOrganizations(response.data);
            setError(null);
        } catch (err) {
            setError('Не удалось загрузить список организаций');
            console.error('Error fetching organizations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (orgId) => {
        setSaving(true);
        try {
            setOrganizations(orgs =>
                orgs.map(org =>
                    org.id === orgId
                        ? { ...org, for_bot: !org.for_bot }
                        : org
                )
            );

            await axios.post(`/api/organization/enable/${orgId}`, {
                enabled: !organizations.find(org => org.id === orgId).for_bot
            });

            setError(null);
        } catch (err) {
            setOrganizations(orgs =>
                orgs.map(org =>
                    org.id === orgId
                        ? { ...org, for_bot: !org.for_bot }
                        : org
                )
            );
            setError('Не удалось обновить настройки');
            console.error('Error updating organization bot settings:', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loader">Загрузка...</div>;
    }

    return (
        <div className="control">
            <h2 className="section__title">Организации для бота</h2>
            <div class="control__description">Выберите организации, которые будут доступны в боте:
                <div class="tooltip tooltip--green">
                    <span class="tooltip__text">Список выбранных организаций будет доступен пользователю для выбора при отправке обращений.</span>
                </div>
            </div>

            <div className='control__wrapper'>
                <div className="control__list">
                    {organizations.map(org => (
                        <div key={org.id} className="control__item">
                            <label className="checkbox">
                                <input
                                    type="checkbox"
                                    checked={org.for_bot}
                                    onChange={() => handleToggle(org.id)}
                                    disabled={saving}
                                />
                                <span className="checkbox__text">{org.name}</span>
                            </label>
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="control__error">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganizationSelection;