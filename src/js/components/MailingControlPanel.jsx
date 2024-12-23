import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import MailingFilter from './MailingFilter';
import 'react-datepicker/dist/react-datepicker.css';

const MailingControlPanel = ({ selectedMailing }) => {
    const [title, setTitle] = useState('');
    const [organization, setOrganization] = useState([]);
    const [department, setDepartment] = useState([]);
    const [position, setPosition] = useState(false);
    const [gender, setGender] = useState(false);
    const [date, setDate] = useState(null);
    const [users, setUsers] = useState([]);
    const [addFilter, setAddFilter] = useState(true);
    const [filterOptions, setFilterOptions] = useState(false);
    const [newFilter, setNewFilter] = useState('');
    const [selectedGender, setSelectedGender] = useState('m');
    const [checkboxBoss, setCheckboxBoss] = useState(false);
    const [checkboxEmployee, setCheckboxEmployee] = useState(false);
    const [mailingChanged, setMailingChanged] = useState(false);
    const [mailingUpdated, setMailingUpdated] = useState(false);
    const [mode, setMode] = useState('filters');    

    useEffect(() => {
        const fetchMailing = async () => {
            if (selectedMailing && selectedMailing !== null) {
                axios
                    .get(`api/mailing/${selectedMailing.id}`)
                    .then((response) => {
                        setData(response.data);
                    })
                    .catch((error) => {
                        console.error('Error fetching mailing:', error);
                    });
            }
        };

        fetchMailing();
    }, [selectedMailing]);

    useEffect(() => {
        const updateMailing = async () => {
            const positions = checkboxBoss && checkboxEmployee ? ['boss', 'employee'] : (checkboxBoss ? ['boss'] : (checkboxEmployee ? ['employee'] : null));
            const formData = {
                title,
                organization,
                department,
                users,
                position: position ? positions : null,
                gender: gender ? selectedGender : null,
                date: date ? date.toISOString() : null,
            };

            if (selectedMailing && selectedMailing !== null) {
                axios
                    .post(`api/mailing/update/${selectedMailing.id}`, formData)
                    .then((response) => {
                        console.log('Mailing updated:', response.data);
                    })
                    .catch((error) => {
                        console.error('Error updating mailing:', error);
                    });
            } else {
                axios
                    .post('api/mailing/create', formData)
                    .then((response) => {
                        console.log('Mailing created:', response.data);
                    })
                    .catch((error) => {
                        console.error('Error creating mailing:', error);
                    });
            }
        };

        if (mailingUpdated) {
            updateMailing();
            setMailingChanged(false);
            setMailingUpdated(false);
        }
    }, [mailingUpdated]);

    const setData = (data) => {
        if (data.user_filter != null && data.user_filter.length > 0) {
            setMode('users');
            setUsers(data.user_filter || []);
        } else {
            setMode('filters');
            setOrganization(data.organization_filter || []);
            setDepartment(data.department_filter || []);
            

            if (data.position_filter !== null && data.position_filter.length > 0) {
                setPosition(true);
                if (data.position_filter.includes('boss')) {
                    setCheckboxBoss(true);
                }
                if (data.position_filter.includes('employee')) {
                    setCheckboxEmployee(true);
                }
            }
            if (data.gender_filter !== null) {
                setGender(true);
                setSelectedGender(data.gender_filter);
            }
        }

        setTitle(data.name || '');
        // setDate(data.date || null);
    };

    const handleGenderChange = (event) => {
        setSelectedGender(event.target.value);
        setMailingChanged(true);
    };

    const handleCheckboxBoss = (event) => {
        setCheckboxBoss(event.target.checked);
        setMailingChanged(true);
    };

    const handleCheckboxEmployee = (event) => {
        setCheckboxEmployee(event.target.checked);
        setMailingChanged(true);
    };

    const handleFilterUpdate = (type, data) => {
        setNewFilter('');
        setAddFilter(true);
        setMailingChanged(true);

        if (type == 'organization') {
            setOrganization(data);
        } else if (type == 'department') {
            setDepartment(data);
        } else if (type == 'users') {
            setUsers(data);
        }
    };

    return (
        <div class="control">
            <h2 class="control__title">Управление рассылкой</h2>

            <div class="control__tabs">
                <div
                    class={(users.length != 0) ? 'control__tab control__tab--disabled' : 'control__tab'}
                    onClick={() => {
                        if (users.length == 0) {
                            setAddFilter(true);
                            setMode('filters');
                            setNewFilter('');
                        }
                    }}
                >Фильтры по организациям</div>
                <div
                    class={!(organization.length == 0 && department.length == 0 && !position && !gender) ? 'control__tab control__tab--disabled' : 'control__tab'}
                    onClick={() => {
                        if (organization.length == 0 && department.length == 0 && !position && !gender) {
                            setAddFilter(false);
                            setMode('users');
                            setAddFilter(false);
                            setNewFilter('users');
                        }
                    }}
                >Адресная коммуникация</div>
            </div>

            <div class="control__wrapper">
                <div class="control__name">
                    <label class="control__label">
                        <span class="control__label--text">Название:</span>
                        <input
                            class="control__input input"
                            type="text"
                            value={title}
                            onChange={(event) => {
                                setTitle(event.target.value);
                                setMailingChanged(true);
                            }}
                        />
                    </label>

                    <div class="tooltip tooltip--blue tooltip--bottom">
                        <span class="tooltip__text">Название необходимо для удобного поиска нужной рассылки внутри самого бота. Используйте названия, которые понятны вам и вашим коллегам.</span>
                    </div>
                </div>

                {(users.length > 0 || newFilter == 'users') && (
                    <MailingFilter filterType='users' data={users} updateHandler={handleFilterUpdate} />
                )}

                {(organization.length > 0 || newFilter == 'organization') && (
                    <MailingFilter filterType='organization' data={organization} updateHandler={handleFilterUpdate} />
                )}

                {(department.length > 0 || newFilter == 'department') && (
                    <MailingFilter filterType='department' data={department} updateHandler={handleFilterUpdate} />
                )}

                {(position) && (
                    <div class="control__checkbox">
                        <label class="control__checkbox--label">
                            <input
                                class="control__checkbox--item"
                                type="checkbox"
                                checked={checkboxBoss}
                                onChange={handleCheckboxBoss}
                            />
                            Руководитель
                        </label>
                        <label class="control__checkbox--label">
                            <input
                                class="control__checkbox--item"
                                type="checkbox"
                                checked={checkboxEmployee}
                                onChange={handleCheckboxEmployee}
                            />
                            Рядовой сотрудник
                        </label>
                        <button 
                            class="filter__active--button button button--blue"
                            onClick={() => {
                                setPosition(false);
                                setMailingChanged(true);
                            }}
                        >+</button>
                    </div>
                )}

                {(gender) && (
                    <div class="control__radio">
                        <label class="control__radio--label">
                            <input
                                class="control__radio--item"
                                type="radio"
                                name="genderFilter"
                                value="M"
                                checked={selectedGender === 'M'}
                                onChange={handleGenderChange}
                            />
                            М
                        </label>
                        <label class="control__radio--label">
                            <input
                                class="control__radio--item"
                                type="radio"
                                name="genderFilter"
                                value="F"
                                checked={selectedGender === 'F'}
                                onChange={handleGenderChange}
                            />
                            Ж
                        </label>
                        <button 
                            class="filter__active--button button button--blue"
                            onClick={() => {
                                setGender(false);
                                setMailingChanged(true);
                            }}
                        >+</button>
                    </div>
                )}

                {(filterOptions) && (
                    <div class="control__row control__row--margin">
                        {(organization.length == 0) && (
                            <button
                                class="button control__row--item button--blue"
                                onClick={() => {
                                    setNewFilter('organization');
                                    setFilterOptions(false);
                                }}
                            >Организация</button>
                        )}
                        {(department.length == 0) && (
                            <button
                                class="button control__row--item button--blue"
                                onClick={() => {
                                    setNewFilter('department');
                                    setFilterOptions(false);
                                }}
                            >Подразделение</button>
                        )}
                        {(!position) && (
                            <button
                                class="button control__row--item button--blue"
                                onClick={() => {
                                    setPosition(true);
                                    setFilterOptions(false);
                                    setAddFilter(true);
                                    setMailingChanged(true);
                                }}
                            >Должность</button>
                        )}
                        {(!gender) && (
                            <button
                                class="button control__row--item button--blue"
                                onClick={() => {
                                    setGender(true);
                                    setFilterOptions(false);
                                    setAddFilter(true);
                                    setMailingChanged(true);
                                }}
                            >Пол</button>
                        )}
                    </div>
                )}

                <div class="control__row">
                    {(addFilter && users.length == 0 && !(organization.length > 0 && department.length > 0 && position && gender)) && (
                        <button
                            class="button control__row--item button--blue"
                            onClick={() => {
                                setAddFilter(false);
                                setFilterOptions(true);
                            }}
                        >Добавить фильтр</button>
                    )}

                    {/* <label>
                        Дата рассылки:
                        <br />
                        <DatePicker selected={date} onChange={(date) => setDate(date)} />
                    </label> */}

                    {mailingChanged && (
                        <button class="button control__row--item button--blue" onClick={() => setMailingUpdated(true)}>Сохранить</button>
                    )}
                </div>

                {/* <button>Удалить рассылку</button> */}
            </div>
        </div>
    );
};

export default MailingControlPanel;
