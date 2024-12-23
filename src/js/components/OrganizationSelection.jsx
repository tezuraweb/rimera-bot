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
        <div className="org-selection">
            <div className="org-selection__header">
                <h3>Организации для бота</h3>
                <div className="tooltip tooltip--blue tooltip--right">
                    <span className="tooltip__text">
                        Выберите организации, которые будут доступны в боте
                    </span>
                </div>
            </div>

            {error && (
                <div className="org-selection__error">
                    {error}
                </div>
            )}

            <div className="org-selection__list">
                {organizations.map(org => (
                    <div key={org.id} className="org-selection__item">
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
        </div>
    );
};

export default OrganizationSelection;