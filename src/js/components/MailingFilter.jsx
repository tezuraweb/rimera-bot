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

    const debouncedSearch = useRef(
        debounce((query) => {
            setSearchQuery(query);
        }, 500)
    ).current;

    useEffect(() => {
        const fetchData = async () => {
            if (filterType == 'organization' || filterType == 'department') {
                let url = '';
                if (filterType == 'organization') {
                    url = searchQuery != '' ? `api/organization/search?q=${searchQuery}` : 'api/organizations';
                } else {
                    url = searchQuery != '' ? `api/department/search?q=${searchQuery}&parent=${parentDep}` : `api/departments?parent=${parentDep}`;
                }
                axios
                    .get(url)
                    .then((response) => {
                        setLoadedData(response.data);
                    })
                    .catch((error) => {
                        console.error('Error fetching data:', error);
                    });
            }

            if (data.length > 0 && activeItems.length == 0) {
                if (filterType == 'organization' || filterType == 'department') {
                    const queryValues = data.join(',');

                    let url = filterType == 'organization' ? `api/organizations/active?id=${queryValues}` : `api/departments/active?id=${queryValues}`;

                    axios
                        .get(url)
                        .then((response) => {
                            setActiveItems(response.data);
                        })
                        .catch((error) => {
                            console.error('Error fetching data:', error);
                        });
                }
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
            <input
                class="filter__input input"
                type="text"
                placeholder={filterType == 'organization' ? 'Организация' : 'Подразделение'}
                onChange={handleInput}
            />
            <div class="filter__list">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className={item.active ? 'filter__list--item active' : 'filter__list--item'}
                        onClick={() => selectItem(index)}
                    >{item.name}</div>
                ))}
            </div>
            
            {/* {(filterType == 'organization' || filterType == 'department') && ( */}
            <div class="filter__active">
                {activeItems.map((item, index) => (
                    <div className={index == parentIndex ? 'filter__active--item active' : 'filter__active--item'} key={index}>
                        <div 
                            class="filter__active--text"
                            onClick={() => selectParent(item.id, index)}
                        >{item.name}</div>
                        <button class="filter__active--button button" onClick={() => removeItem(item.id)}>+</button>
                    </div>
                ))}
            </div>
            {/* )} */}
            {(filterChanged) && (
                <button class="button" onClick={handleSave}>Сохранить фильтр</button>
            )}
        </div>
    );
};

export default MailingFilter;