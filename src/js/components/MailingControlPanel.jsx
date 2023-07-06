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
    const [addFilter, setAddFilter] = useState(true);
    const [filterOptions, setFilterOptions] = useState(false);
    const [newFilter, setNewFilter] = useState('');
    const [selectedGender, setSelectedGender] = useState('m');
    const [checkboxBoss, setCheckboxBoss] = useState(false);
    const [checkboxEmployee, setCheckboxEmployee] = useState(false);
    const [publishToChannels, setPublishToChannels] = useState(false);
    const [mailingChanged, setMailingChanged] = useState(false);
    const [mailingUpdated, setMailingUpdated] = useState(false);
    

    const channels = ['@test_rimera'];


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
                position: positions,
                gender: gender ? selectedGender : null,
                date: date ? date.toISOString() : null,
                channels: publishToChannels ? channels : null,
            };

            if (selectedMailing && selectedMailing !== null) {
                axios
                    .post(`api/mailing-update/${selectedMailing.id}`, formData)
                    .then((response) => {
                        console.log('Mailing updated:', response.data);
                    })
                    .catch((error) => {
                        console.error('Error updating mailing:', error);
                    });
            } else {
                axios
                    .post('api/mailing-create', formData)
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
        setTitle(data.name || '');
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
        setDate(data.date || null);
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

    const handleCheckboxChannels = (event) => {
        setPublishToChannels(event.target.checked);
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
        }
    };

    return (
        <div class="control">
            <div class="control__wrapper">
                <h2 class="control__title">Панель управления рассылкой</h2>

                <div class="control__name">
                    <label class="control__label">
                        Название:
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
                </div>

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
                    </div>
                )}

                {(gender) && (
                    <div class="control__radio">
                        <label class="control__radio--label">
                            <input
                                class="control__radio--item"
                                type="radio"
                                name="genderFilter"
                                value="m"
                                checked={selectedGender === 'm'}
                                onChange={handleGenderChange}
                            />
                            М
                        </label>
                        <label class="control__radio--label">
                            <input
                                class="control__radio--item"
                                type="radio"
                                name="genderFilter"
                                value="f"
                                checked={selectedGender === 'f'}
                                onChange={handleGenderChange}
                            />
                            Ж
                        </label>
                    </div>
                )}

                {(filterOptions) && (
                    <div class="control__row">
                        {(organization.length == 0) && (
                            <button
                                class="button control__row--item"
                                onClick={() => {
                                    setNewFilter('organization');
                                    setFilterOptions(false);
                                }}
                            >Организация</button>
                        )}
                        {(department.length == 0) && (
                            <button
                                class="button control__row--item"
                                onClick={() => {
                                    setNewFilter('department');
                                    setFilterOptions(false);
                                }}
                            >Подразделение</button>
                        )}
                        {(!position) && (
                            <button
                                class="button control__row--item"
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
                                class="button control__row--item"
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

                <div class="control__checkbox">
                    <label class="control__checkbox--label">
                        <input
                            class="control__checkbox--item"
                            type="checkbox"
                            checked={publishToChannels}
                            onChange={handleCheckboxChannels}
                        />
                        Опубликовать в каналы
                    </label>
                </div>

                <div class="control__row">
                    {(addFilter && !(organization.length > 0 && department.length > 0 && position && gender)) && (
                        <button
                            class="button control__row--item"
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
                        <button class="button control__row--item" onClick={() => setMailingUpdated(true)}>Сохранить</button>
                    )}
                </div>

                {/* <button>Удалить рассылку</button> */}
            </div>
        </div>
    );
};

export default MailingControlPanel;
