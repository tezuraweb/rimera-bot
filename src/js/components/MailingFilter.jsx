import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { debounce } from "lodash";

const MailingFilter = ({ filterType, data, updateHandler }) => {
    const [loadedData, setLoadedData] = useState([]);
    const [items, setItems] = useState([]);
    const [activeItems, setActiveItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [parentDep, setParentDep] = useState(0);
    const [parentIndex, setParentIndex] = useState(-1);
    const [filterChanged, setFilterChanged] = useState(false);

    const info =  {
        'organization': {
            title: 'Организации',
            summary: 'Выберите одну или несколько организаций для рассылки',
            tooltip: 'Выберите нужные организации из списка, вы также можете воспользоваться поиском: для этого начните печатать название в поле “Организации”. Если ошибетесь - нажмите на крестик рядом с лишним фильтром.'
        },
        'department': {
            title: 'Подразделения',
            summary: 'Выберите одно или несколько подразделений для рассылки',
            tooltip: 'Выберите нужные подразделения из списка, вы также можете воспользоваться поиском: для этого начните печатать название в поле “Подразделения”. Если ошибетесь - нажмите на крестик рядом с лишним фильтром. Для выбора дочерних подразделений нажмите на название выбранного отдела, и в списке отобразятся его дочерние подразделения. Подразделения всех уровней также доступны при поиске.'
        }
    }

    const debouncedSearch = useRef(
        debounce((query) => {
            setSearchQuery(query);
        }, 500)
    ).current;

    useEffect(() => {
        const fetchData = async () => {
            let url = '';

            if (searchQuery != '') {
                if (filterType == 'organization') {
                    url = `api/organization/search?q=${searchQuery}`;
                } else if (filterType == 'department') {
                    url = `api/department/search?q=${searchQuery}&parent=${parentDep}`;
                } else if (filterType == 'users') {
                    url = `api/users/search?q=${searchQuery}`;
                }
            } else {
                if (filterType == 'organization') {
                    url = 'api/organizations';
                } else if (filterType == 'department') {
                    url = `api/departments?parent=${parentDep}`;
                } else if (filterType == 'users') {
                    url = 'api/users';
                }
            }

            axios
                .get(url)
                .then((response) => {
                    setLoadedData(response.data);
                })
                .catch((error) => {
                    console.error('Error fetching data:', error);
                });

            if (data.length > 0 && activeItems.length == 0) {
                const queryValues = data.join(',');

                if (filterType == 'organization') {
                    url = `api/organizations/active?id=${queryValues}`;
                } else if (filterType == 'department') {
                    url = `api/departments/active?id=${queryValues}`;
                } else if (filterType == 'users') {
                    url = `api/users/active?id=${queryValues}`;
                }

                axios
                    .get(url)
                    .then((response) => {
                        setActiveItems(response.data);
                    })
                    .catch((error) => {
                        console.error('Error fetching data:', error);
                    });
            }
        };

        fetchData();
    }, [searchQuery, parentDep]);

    useEffect(() => {
        const updateItems = async () => {
            setItems(loadedData.map((item) => {
                let isActive = data.includes(item.id);
                return { ...item, active: isActive };
            }));
        };

        updateItems();
    }, [loadedData]);

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    const selectItem = async (index) => {
        items[index].active = !items[index].active;
        if (items[index].active) {
            setActiveItems(prev => [...prev, items[index]]);
        } else {
            setActiveItems(prev => prev.filter(item => item.id != items[index].id));
        }
        setFilterChanged(true);
        if (parentDep > 0) {
            removeItem(parentDep);
            setParentIndex(-1);
        }
    };

    const removeItem = (id) => {
        const index = items.findIndex((element) => element.id == id);
        if (index > -1) {
            items[index].active = false;
        }
        setFilterChanged(true);
        setActiveItems(prev => prev.filter(item => item.id != id));
    };

    const selectParent = async (id, index) => {
        if (filterType == 'department') {
            if (parentDep == id) {
                setParentDep(0);
                setParentIndex(-1);
            } else {
                setParentDep(id);
                setParentIndex(index);
            }
        }
    };

    const handleInput = async (e) => {
        debouncedSearch(e.target.value);
    };

    const handleSave = async () => {
        setFilterChanged(false);
        updateHandler(filterType, activeItems.map(item => item.id));
    };

    return (
        <div class="filter">
            {(info[filterType]) && (
                <div class="filter__heading">
                    <div class="filter__title">{info[filterType].title}</div>
                    <div class="filter__description">
                        <span>{info[filterType].summary}</span>
                        <div class="tooltip tooltip--blue">
                            <span class="tooltip__text">{info[filterType].tooltip}</span>
                        </div>
                    </div>
                </div>
            )}
            
            <input
                class="filter__input input"
                type="text"
                placeholder={filterType == 'organization' ? 'Организация' : (filterType == 'department' ? 'Подразделение' : 'Пользователь')}
                onChange={handleInput}
            />
            <div class="filter__list">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className={item.active ? 'filter__list--item active' : 'filter__list--item'}
                        onClick={() => selectItem(index)}
                    >
                        <span>{item.name}</span>
                        {filterType == 'users' && (
                            <a class="link" href={'https://t.me/' + item.tgid} target='_blank' rel='nofollow noopener'>{' @' + item.tgid}</a>
                        )}
                    </div>
                ))}
            </div>
            
            <div class="filter__active">
                {activeItems.map((item, index) => (
                    <div className={index == parentIndex ? 'filter__active--item active' : 'filter__active--item'} key={index}>
                        <div 
                            class="filter__active--text"
                            onClick={() => selectParent(item.id, index)}
                        >
                            <span>{item.name}</span>
                            {filterType == 'users' && (
                                <a class="link" href={'https://t.me/' + item.tgid} target='_blank' rel='nofollow noopener'>{' @' + item.tgid}</a>
                            )}
                        </div>
                        <button class="filter__active--button button button--blue" onClick={() => removeItem(item.id)}>+</button>
                    </div>
                ))}
            </div>
            
            {(filterChanged) && (
                <button class="button button--blue" onClick={handleSave}>Сохранить фильтр</button>
            )}
        </div>
    );
};

export default MailingFilter;