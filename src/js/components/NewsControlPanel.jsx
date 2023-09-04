import React, { useEffect, useState } from 'react';
import axios from 'axios';

const NewsControlPanel = ({ selectedNews }) => {
    const [images, setImages] = useState([]);
    const [hasImages, setHasImages] = useState(false);
    const [newsText, setNewsText] = useState('');
    const [newsChanged, setNewsChanged] = useState(false);
    const [newsUpdated, setNewsUpdated] = useState(false);

    useEffect(() => {
        let promises = [];

        const fetchImages = async () => {
            try {
                if (selectedNews.files !== null && selectedNews.files.length > 0) {
                    selectedNews.files.forEach(file => {
                        promises.push(getImageHref(file));
                    });

                    const res = await Promise.all(promises);

                    setImages(res);
                    setHasImages(true);
                }
            } catch (error) {
                console.log('Ошибка при загрузке изображений:', error);
            }
        };

        if (selectedNews !== null) {
            fetchImages();
            setNewsText(selectedNews.text);
        }
    }, [selectedNews]);

    useEffect(() => {
        const updateNews = async () => {
            axios
                .post(`api/news-update/${selectedNews.id}`, { 'text': newsText })
                .then((response) => {
                    console.log('News updated:', response.data);
                })
                .catch((error) => {
                    console.error('Error updating news:', error);
                });
        };

        if (newsUpdated) {
            updateNews();
            setNewsChanged(false);
            setNewsUpdated(false);
        }
    }, [newsUpdated]);

    const getImageHref = (id) => {
        return new Promise((resolve, reject) => {
            const response = axios.get(`/api/news/image/${id}`);
            response.then((res) => {
                if (res.status == 400) {
                    console.log(res.error);
                    reject(null);
                }
                resolve(res.data);
            });
        });
    }

    return (
        <div class="control">
            {selectedNews && (
                <div>
                    <h2 class="control__title">Редактор новостей</h2>
                    <div class="control__wrapper">
                        <div class="control__link">
                            <span>Автор: </span>
                            <a class="link" href={'https://t.me/' + selectedNews.username} target='_blank' rel='nofollow noopener'>{'@' + selectedNews.username}</a>
                            <div class="control__description">Текст новости:
                                <div class="tooltip tooltip--green">
                                    <span class="tooltip__text">Вы можете отредактировать текст новости, для этого кликните в поле ниже и начните вводить текст.  Затем кликните по кнопке “Сохранить”. После сохранения выйдите из панели администратора и опубликуйте ваши новости через бота.</span>
                                </div>
                            </div>
                        </div>
                        <textarea
                            class="control__text"
                            cols="50"
                            rows="8"
                            value={newsText}
                            onChange={(event) => {
                                setNewsText(event.target.value);
                                setNewsChanged(true);
                            }}
                        ></textarea>
                        {hasImages && (
                            <div class="control__images flex">
                                {images.filter(img => img !== null).map((img, index) => (
                                    <div class="control__images--item flex-item" key={index}>
                                        <img src={img} alt="img" />
                                    </div>
                                ))}
                            </div>
                        )}
                        {newsChanged && (
                            <button class="control__button button button--green" onClick={() => setNewsUpdated(true)}>Сохранить</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsControlPanel;
