import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModalDelete from './ModalDelete';

const EmailComponent = () => {
    const [emailList, setEmailList] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [address, setAddress] = useState('');
    const [type, setType] = useState('');
    const [organization, setOrganization] = useState('');
    const [error, setError] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [organizations, setOrganizations] = useState([]);
    const [showOrgList, setShowOrgList] = useState(false);
    const [orgSearchInput, setOrgSearchInput] = useState('');
    const [filteredOrgs, setFilteredOrgs] = useState([]);
    const [users, setUsers] = useState([]);
    const [showUserList, setShowUserList] = useState(false);
    const [userSearchInput, setUserSearchInput] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');


    useEffect(() => {
        const fetchEmails = async () => {
            try {
                const response = await axios.get('/api/emails');
                setEmailList(response.data);
            } catch (error) {
                console.error('Error fetching emails:', error);
            }
        };

        const fetchOrganizations = async () => {
            try {
                const response = await axios.get('/api/organizations');
                setOrganizations(response.data);
                setFilteredOrgs(response.data);
            } catch (error) {
                console.error('Error fetching organizations:', error);
            }
        };

        const fetchUsers = async () => {
            try {
                const response = await axios.get('/api/users/admins');
                setUsers(response.data);
                setFilteredUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchEmails();
        fetchOrganizations();
        fetchUsers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!address || !type || !selectedUser) {
            setError('Заполните все обязательные поля!');
            return;
        }

        try {
            if (selectedItem) {
                const response = await axios.post(`/api/email/update/${selectedItem.id}`, {
                    address,
                    type,
                    organization,
                    user: selectedUser
                });
                setEmailList(emailList.map(email =>
                    email.id === selectedItem.id ? response.data : email
                ));
            } else {
                const response = await axios.post('/api/email/create', {
                    address,
                    type,
                    organization,
                    user: selectedUser
                });
                setEmailList([...emailList, response.data]);
            }

            resetForm();
            setError(null);
        } catch (err) {
            setError('Не удалось сохранить изменения');
            console.error('Error saving email:', err);
        }
    };

    const handleOrgSearch = (e) => {
        const value = e.target.value;
        setOrgSearchInput(value);
        setShowOrgList(true);

        const filtered = organizations.filter(org =>
            org.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredOrgs(filtered);
    };

    const handleUserSearch = (e) => {
        const value = e.target.value;
        setUserSearchInput(value);
        setShowUserList(true);

        const filtered = users.filter(user =>
            user.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredUsers(filtered);
    };

    const selectUser = (user) => {
        setSelectedUser(user.id);
        setUserSearchInput(user.name);
        setShowUserList(false);
    };

    const selectOrganization = (org) => {
        setOrganization(org.id);
        setOrgSearchInput(org.name);
        setShowOrgList(false);
    };

    const handleSelect = (item) => {
        setSelectedItem(item);
        setAddress(item.address || '');
        setType(item.type || '');
        setOrganization(item.organization || '');
        setSelectedUser(item.user || '');
        const org = organizations.find(o => o.id === item.organization);
        const user = users.find(u => u.id === item.user);
        setOrgSearchInput(org ? org.name : '');
        setUserSearchInput(user ? user.name : '');
    };

    const handleDelete = async (item) => {
        setItemToDelete(item);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`/api/email/${itemToDelete.id}`);
            setEmailList(emailList.filter(email => email.id !== itemToDelete.id));
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            setError(null);
        } catch (err) {
            setError('Не удалось удалить email');
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            console.error('Error deleting email:', err);
        }
    };

    const resetForm = () => {
        setSelectedItem(null);
        setAddress('');
        setType('');
        setOrganization('');
        setOrgSearchInput('');
        setSelectedUser('');
        setUserSearchInput('');
    };

    return (
        <div className="email-manager">
            <div className="list">
                <div className="list__wrapper">
                    {emailList.map(emailItem => (
                        <div key={emailItem.id} className="list__item">
                            <div className="list__text">{emailItem.address}</div>
                            <div className="list__row">
                                <button
                                    className="list__button--left button button--blue"
                                    onClick={() => handleSelect(emailItem)}
                                >
                                    Выбрать
                                </button>
                                <button
                                    className="list__button--right button button--red"
                                    onClick={() => handleDelete(emailItem)}
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
                        <span className="control__label--text">Email адрес:</span>
                        <input
                            className="control__input input"
                            type="email"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            required
                        />
                    </label>

                    <div className="tooltip tooltip--blue tooltip--bottom">
                        <span className="tooltip__text">
                            Введите корпоративный email адрес
                        </span>
                    </div>
                </div>

                <div className="control__group">
                    <label className="control__label">
                        <span className="control__label--text">Тип:</span>
                        <select
                            className="control__input input"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            required
                        >
                            <option value="">Выберите тип обращения</option>
                            <option value="appeal_feature">Предложение по улучшению</option>
                            <option value="appeal_problem">Сообщение о проблеме</option>
                            <option value="appeal_security">Служба безопасности</option>
                            <option value="appeal_ceo">Приемная исполнительного директора</option>
                            <option value="appeal_hr">Дирекция по персоналу</option>
                            <option value="appeal_labour">Охрана труда</option>
                            <option value="appeal_youth">Совет молодежи</option>
                            <option value="appeal_medroom">Медпункт</option>
                            <option value="appeal_salary">Заработная плата и расчеты</option>
                            <option value="appeal_workplace">Обслуживание рабочего места</option>
                        </select>
                    </label>

                    <div className="tooltip tooltip--blue tooltip--bottom">
                        <span className="tooltip__text">
                            Укажите тип email адреса
                        </span>
                    </div>
                </div>

                <div className="control__group">
                    <label className="control__label">
                        <span className="control__label--text">Организация:</span>
                        <div className="filter">
                            <input
                                className="filter__input input"
                                type="text"
                                placeholder="Организация"
                                value={orgSearchInput}
                                onChange={handleOrgSearch}
                                onFocus={() => setShowOrgList(true)}
                            />
                            {showOrgList && (
                                <div className="filter__list">
                                    {filteredOrgs.map((org, index) => (
                                        <div
                                            key={index}
                                            className="filter__list--item"
                                            onClick={() => selectOrganization(org)}
                                        >
                                            <span>{org.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </label>

                    <div className="tooltip tooltip--blue tooltip--bottom">
                        <span className="tooltip__text">
                            Выберите организацию из списка
                        </span>
                    </div>
                </div>

                <div className="control__group">
                    <label className="control__label">
                        <span className="control__label--text">Пользователь:</span>
                        <div className="filter">
                            <input
                                className="filter__input input"
                                type="text"
                                placeholder="Пользователь"
                                value={userSearchInput}
                                onChange={handleUserSearch}
                                onFocus={() => setShowUserList(true)}
                            />
                            {showUserList && (
                                <div className="filter__list">
                                    {filteredUsers.map((user, index) => (
                                        <div
                                            key={index}
                                            className="filter__list--item"
                                            onClick={() => selectUser(user)}
                                        >
                                            <span>{user.name}</span>
                                            {user.tgid && (
                                                <a className="link" href={'https://t.me/' + user.tgid} target='_blank' rel='nofollow noopener'>
                                                    {' @' + user.tgid}
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </label>

                    <div className="tooltip tooltip--blue tooltip--bottom">
                        <span className="tooltip__text">
                            Выберите ответственного пользователя из списка
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
                <ModalDelete
                    text={'Вы уверены, что хотите удалить этот email?'}
                    setShowDeleteConfirm={setShowDeleteConfirm}
                    confirmDelete={confirmDelete}
                />
            )}
        </div>
    );
};

export default EmailComponent;