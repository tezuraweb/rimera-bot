const { Scenes, Markup } = require('telegraf');
const User = require('./models/User');
const News = require('./models/News');
const Department = require('./models/Department');
const Organization = require('./models/Organization');
const Position = require('./models/Position');

const TG_CHANNEL = '@test_rimera';

class SceneGenerator {
    AuthScene() {
        const authScene = new Scenes.BaseScene('AUTH_SCENE');

        authScene.enter(async (ctx) => {
            try {
                let user = await User.getUser(ctx.from.id);

                if (user) {
                    ctx.reply("Добро пожаловать, " + user.name + "!");
                    if (user.status == 'admin') {
                        return ctx.scene.enter('ADMIN_MENU_SCENE');
                    } else {
                        return ctx.scene.enter('MAIN_MENU_SCENE');
                    }
                } else {
                    ctx.reply("Добро пожаловать! Для регистрации отправьте номер телефона");
                }
            } catch (e) {
                ctx.reply("Ошибка!");
                console.log(e.message);
            }
        });

        authScene.on("message", async (ctx) => {
            try {
                let phoneNumber = ctx.message.text.trim();
                let user = await User.getPhone(phoneNumber);

                if (user) {
                    user = await User.signIn(user.id, ctx.from.id, phoneNumber);
                    if (user) {
                        ctx.reply("Добро пожаловать, " + user.name + "!");
                        if (user.status == 'admin') {
                            return ctx.scene.enter('ADMIN_MENU_SCENE');
                        } else {
                            return ctx.scene.enter('MAIN_MENU_SCENE');
                        }
                    } else {
                        ctx.reply("Ошибка авторизации!");
                    }
                } else {
                    ctx.reply("Номер отсутствует в базе!");
                }

            } catch (e) {
                ctx.reply("Ошибка!");
                console.log(e.message);
            }
        });

        return authScene;
    }

    MainMenuScene() {
        const menuScene = new Scenes.BaseScene('MAIN_MENU_SCENE');

        menuScene.enter((ctx) => {
            ctx.reply(
                "Выберите пункт меню:",
                Markup.keyboard(["Предложить новость", "Информационная картина недели", "Конкурсы", "Опросы", "Онлайн приемная руководителя", "Профсоюз"]).oneTime().resize(),
            );
        });

        menuScene.hears("Предложить новость", (ctx) => {
            return ctx.scene.enter('ADD_NEWS_SCENE');
        });

        // menuScene.hears("Информационная картина недели", (ctx) => {
        //     ctx.reply("Yay!")
        //     return ctx.scene.enter('INFO_SCENE');
        // });

        // menuScene.hears("Конкурсы", (ctx) => {
        //     ctx.reply("Yay!")
        //     return ctx.scene.enter('CONTESTS_SCENE');
        // });

        // menuScene.hears("Опросы", (ctx) => {
        //     ctx.reply("Yay!")
        //     return ctx.scene.enter('SURVEY_SCENE');
        // });

        // menuScene.hears("Онлайн приемная руководителя", (ctx) => {
        //     ctx.reply("Yay!")
        //     return ctx.scene.enter('BOSS_SCENE');
        // });

        // menuScene.hears("Профсоюз", (ctx) => {
        //     ctx.reply("Yay!")
        //     return ctx.scene.enter('UNION_SCENE');
        // });

        // menuScene.leave((ctx) => {
        //     ctx.reply('Thank you for your time!');
        // });

        return menuScene;
    }

    AdminMenuScene() {
        const adminMenuScene = new Scenes.BaseScene('ADMIN_MENU_SCENE');

        adminMenuScene.enter((ctx) => {
            ctx.reply(
                "Выберите пункт меню:",
                Markup.keyboard(["Раздел новостей", "Создать рассылку"]).oneTime().resize(),
            );
        });

        adminMenuScene.hears("Раздел новостей", (ctx) => {
            ctx.reply(
                "Выберите пункт меню:",
                Markup.keyboard(["Предложить новость", "Предложка", "Назад"]).oneTime().resize(),
            );
        });

        adminMenuScene.hears("Создать рассылку", (ctx) => {
            return ctx.scene.enter('MAILING_SCENE');
        });

        adminMenuScene.hears("Предложить новость", (ctx) => {
            return ctx.scene.enter('ADD_NEWS_SCENE');
        });

        adminMenuScene.hears("Предложка", (ctx) => {
            return ctx.scene.enter('NEWS_INBOX_SCENE');
        });

        adminMenuScene.hears("Назад", (ctx) => {
            return ctx.scene.enter('ADMIN_MENU_SCENE');
        });

        return adminMenuScene;
    }

    AddNewsScene() {
        const newsScene = new Scenes.BaseScene('ADD_NEWS_SCENE');

        newsScene.enter(async (ctx) => {
            ctx.session.myData = {
                newsText: '',
                photo: [],
                newsId: -1,
                status: 'common',
            };
            try {
                let user = await User.getUser(ctx.from.id);

                if (user) {
                    ctx.session.myData.status = user.status;
                } else {
                    ctx.reply("Произошла ошибка авторизации!");
                    return ctx.scene.reenter();
                }
            } catch (e) {
                ctx.reply("Ошибка!");
                console.log(e.message);
                return ctx.scene.reenter();
            }

            ctx.reply(
                "Напишите текст новости",
                Markup.keyboard(["Назад"]).oneTime().resize(),
            );
        });

        newsScene.hears("Назад", (ctx) => {
            if (ctx.session.myData.status == 'admin') {
                return ctx.scene.enter('ADMIN_MENU_SCENE');
            } else {
                return ctx.scene.enter('MAIN_MENU_SCENE');
            }
        });

        newsScene.hears("Отмена", (ctx) => {
            return ctx.scene.reenter();
        });

        newsScene.hears("Подтвердить", async (ctx) => {
            try {
                let user = await User.getUser(ctx.from.id);

                if (user) {
                    let newPost = await News.addPost(user.id, ctx.session.myData);
                    ctx.session.myData.newsId = newPost.id;

                    if (user.status == 'admin') {
                        ctx.reply(
                            "Новость добавлена в предложку! Хотите отправить в публикацию?",
                            Markup.keyboard(["Опубликовать", "Оставить в предложке", "Отмена"])
                        );
                    } else {
                        ctx.reply("Новость добавлена в предложку!");
                        return ctx.scene.enter('MAIN_MENU_SCENE');
                    }
                } else {
                    ctx.reply("Произошла ошибка авторизации!");
                    return ctx.scene.reenter();
                }
            } catch (e) {
                ctx.reply("Ошибка!");
                console.log(e.message);
                return ctx.scene.reenter();
            }
        });

        newsScene.hears("Опубликовать", async (ctx) => {
            try {
                if (ctx.session.myData.photo.length > 0) {
                    ctx.telegram.sendMediaGroup(TG_CHANNEL, ctx.session.myData.photo.map((item, index) => {
                        if (index == 0) {
                            return {
                                media: item,
                                caption: ctx.session.myData.newsText,
                                type: 'photo',
                            }
                        }
    
                        return { media: item, type: 'photo' }
                    }));
                } else {
                    ctx.telegram.sendMessage(TG_CHANNEL, ctx.session.myData.newsText);
                }

                await News.publishNews(ctx.session.myData.newsId);

                ctx.reply("Сообщение успешно опубликовано!")
            } catch (e) {
                ctx.reply("Не удалось опубликовать сообщение!");
                console.log(e.message);
            }

            return ctx.scene.enter('ADMIN_MENU_SCENE');
        });

        newsScene.hears("Оставить в предложке", (ctx) => {
            ctx.reply("Новость можно рассмотреть и опубликовать позднее в разделе Предложка");
            return ctx.scene.enter('ADMIN_MENU_SCENE');
        });

        newsScene.on("message", (ctx) => {
            if (ctx.update.message.photo) {
                if (ctx.session.myData.newsText == '') {
                    ctx.reply(
                        "Сначала задайте текст новости!",
                        Markup.keyboard(["Отмена"]).oneTime().resize(),
                    );
                } else {
                    const files = ctx.update.message.photo;
                    const fileId = files[1].file_id;
                    ctx.session.myData.photo.push(fileId);
                    ctx.reply(
                        "Фото добавлено!",
                        Markup.keyboard(["Подтвердить", "Отмена"]).oneTime().resize(),
                    );
                }
            } else if (ctx.session.myData.newsText == '') {
                ctx.session.myData.newsText = ctx.message.text;
                ctx.reply(
                    "Добавьте фото",
                    Markup.keyboard(["Подтвердить", "Отмена"]).oneTime().resize(),
                );
            }
        });

        return newsScene;
    }

    NewsInboxScene() {
        const newsInboxScene = new Scenes.BaseScene('NEWS_INBOX_SCENE');

        newsInboxScene.enter(async (ctx) => {
            ctx.session.myData = {
                newsList: [],
                newsCount: 0,
                newsIndex: -1,
            };

            try {
                ctx.session.myData.newsList = await News.getInbox();
                ctx.session.myData.newsCount = ctx.session.myData.newsList.length;

                if (ctx.session.myData.newsIndex + 1 < ctx.session.myData.newsCount) {
                    ctx.reply(
                        `Неопубликованных новостей: ${ctx.session.myData.newsCount}`,
                        Markup.keyboard(["Показать следующую новость", "Назад"]).oneTime().resize(),
                    );
                } else {
                    ctx.reply(
                        `Неопубликованных новостей: ${ctx.session.myData.newsCount}`,
                        Markup.keyboard(["Назад"]).oneTime().resize(),
                    );
                }
            } catch (e) {
                reject("Не удалось загрузить данные!");
                console.log(e.message);
                return ctx.scene.enter('ADMIN_MENU_SCENE');
            }
        });

        newsInboxScene.hears("Показать следующую новость", async (ctx) => {
            try {
                ctx.session.myData.newsIndex += 1;

                let content = ctx.session.myData.newsList[ctx.session.myData.newsIndex];
                let user = await User.getUserById(content.creator);

                if (content.files.length > 0) {
                    ctx.replyWithMediaGroup(content.files.map((item, index) => {
                        if (index == 0) {
                            return {
                                media: item,
                                caption: content.text,
                                type: 'photo',
                            }
                        }
    
                        return { media: item, type: 'photo' }
                    }));
                } else {
                    ctx.reply(content.text);
                }

                if (ctx.session.myData.newsIndex + 1 < ctx.session.myData.newsCount) {
                    ctx.reply(
                        `Автор новости: ${user.name}`,
                        Markup.keyboard(["Опубликовать", "Показать следующую новость", "Назад"]).oneTime().resize(),
                    );
                } else {
                    ctx.reply(
                        `Автор новости: ${user.name}`,
                        Markup.keyboard(["Опубликовать", "Назад"]).oneTime().resize(),
                    );
                }
            } catch (e) {
                ctx.reply("Не удалось отобразить сообщение!");
                console.log(e.message);
                return ctx.scene.reenter();
            }
        });

        newsInboxScene.hears("Опубликовать", async (ctx) => {
            try {
                let content = ctx.session.myData.newsList[ctx.session.myData.newsIndex];

                if (content.files.length > 0) {
                    ctx.telegram.sendMediaGroup(TG_CHANNEL, content.files.map((item, index) => {
                        if (index == 0) {
                            return {
                                media: item,
                                caption: content.text,
                                type: 'photo',
                            }
                        }
    
                        return { media: item, type: 'photo' }
                    }));
                } else {
                    ctx.telegram.sendMessage(TG_CHANNEL, content.text);
                }

                await News.publishNews(content.id);

                if (ctx.session.myData.newsIndex + 1 < ctx.session.myData.newsCount) {
                    ctx.reply(
                        "Сообщение успешно опубликовано!",
                        Markup.keyboard(["Показать следующую новость", "Назад"]).oneTime().resize(),
                    );
                } else {
                    ctx.reply(
                        "Сообщение успешно опубликовано!",
                        Markup.keyboard(["Назад"]).oneTime().resize(),
                    );
                }
            } catch (e) {
                ctx.reply("Не удалось опубликовать сообщение!");
                console.log(e.message);
                return ctx.scene.reenter();
            }
        });

        newsInboxScene.hears("Назад", (ctx) => {
            return ctx.scene.enter('ADMIN_MENU_SCENE');
        });

        return newsInboxScene;
    }

    MailingScene() {
        const mailingScene = new Scenes.BaseScene('MAILING_SCENE');

        mailingScene.enter(async (ctx) => {
            ctx.session.myData = {
                filters: {
                    department: [],
                    organizations: [],
                    position: [],
                },
                hasFilters: false,
                currentFilter: "",
                filtersCompleted: false,
            };

            ctx.reply(
                "Выберите пункт меню",
                Markup.keyboard(["Добавить фильтр", "Создать сообщение", "Назад"]).oneTime().resize(),
            );
        });

        mailingScene.hears("Добавить фильтр", (ctx) => {
            ctx.reply(
                "Выберите фильтры",
                Markup.keyboard(["Отдел", "Организация", "Должность", "Отмена"]).oneTime().resize(),
            );
        });

        mailingScene.hears("Отдел", async (ctx) => {
            ctx.session.myData.currentFilter = "deps";

            try {
                let deps = await Department.getRoot();

                ctx.session.myData.currentItems = deps.map((item, index) => {
                    return { id: item.id, index: index }
                });

                ctx.reply(
                    `Для выбора департаментов наберите номера через запятую:
                    ${deps.reduce((acc, curr, index) => {
                        return acc + index.toString() + ": " + curr.name + "\n";
                    }, '')}`,
                    Markup.keyboard(["Отмена"]).oneTime().resize(),
                );
            } catch (e) {
                ctx.reply("Не удалось получить данные!");
                console.log(e.message);
                return ctx.scene.reenter();
            }
        });

        mailingScene.hears("Организация", async (ctx) => {
            ctx.session.myData.currentFilter = "organizations";

            try {
                let organizations = await Organization.getAll();

                ctx.session.myData.currentItems = organizations.map((item, index) => {
                    return { id: item.id, index: index }
                });

                ctx.reply(
                    `Для выбора организаций наберите номера через запятую:
                    ${organizations.reduce((acc, curr, index) => {
                        return acc + index.toString() + ": " + curr.name + "\n";
                    }, '')}`,
                    Markup.keyboard(["Отмена"]).oneTime().resize(),
                );
            } catch (e) {
                ctx.reply("Не удалось получить данные!");
                console.log(e.message);
                return ctx.scene.reenter();
            }            
        });

        mailingScene.hears("Должность", async (ctx) => {
            ctx.session.myData.currentFilter = "position";

            try {
                let positions = await Position.getAll();

                ctx.session.myData.currentItems = positions.map((item, index) => {
                    return { id: item.id, index: index }
                });

                ctx.reply(
                    `Для выбора должностей наберите номера через запятую:
                    ${positions.reduce((acc, curr, index) => {
                        return acc + index.toString() + ": " + curr.name + "\n";
                    }, '')}`,
                    Markup.keyboard(["Отмена"]).oneTime().resize(),
                );
            } catch (e) {
                ctx.reply("Не удалось получить данные!");
                console.log(e.message);
                return ctx.scene.reenter();
            }            
        });

        mailingScene.hears("Завершить фильтр", async (ctx) => {
            if (ctx.session.myData.currentFilter = "deps") {
                try {
                    ctx.session.myData.filters.department = ctx.session.myData.filters.department.concat(ctx.session.myData.chosenDeps);

                    if (ctx.session.myData.currentItems.length > 0) {
                        let depsIds = ctx.session.myData.currentItems.map(item => {
                            return item.id;
                        });
    
                        while (depsIds.length > 0) {
                            ctx.session.myData.filters.department = ctx.session.myData.filters.department.concat(depsIds);
    
                            let deps = await Department.getSubdivision(depsIds);
        
                            depsIds = deps.map((item) => {
                                return item.id;
                            });
                        }
                    }

                    ctx.session.myData.hasFilters = true;

                    ctx.reply(
                        "Фильтр добавлен!",
                        Markup.keyboard(["Добавить фильтр", "Создать сообщение", "Отмена"]).oneTime().resize(),
                    );
                } catch (e) {
                    ctx.reply("Ошибка!");
                    console.log(e.message);
                    return ctx.scene.reenter();
                }
            }
        });

        mailingScene.hears("Создать сообщение", (ctx) => {
            ctx.session.myData.filtersCompleted = true;
            ctx.reply(
                "Напишите сообщение, при необходимости добавьте медиа-файлы. После отправки сообщение будет разослано отфильтрованным пользователям",
                Markup.keyboard(["Отмена"]).oneTime().resize(),
            );
        });

        mailingScene.hears("Назад", (ctx) => {
            return ctx.scene.enter('ADMIN_MENU_SCENE');
        });

        mailingScene.hears("Отмена", (ctx) => {
            return ctx.scene.reenter();
        });

        mailingScene.on("message", async (ctx) => {
            if (ctx.session.myData.filtersCompleted) {
                try {
                    let users = [];
                    const promises = [];

                    if (ctx.session.myData.hasFilters) {
                        users = await User.getUsersWithFilter(ctx.session.myData.filters);
                    } else {
                        users = await User.getAll();
                    }

                    function sendMessage(chatId) {
                        return new Promise((resolve) => {
                            ctx.copyMessage(chatId);
                            console.log('sent to', chatId);
                            resolve(chatId);
                        });
                    }
                    
                    users.forEach(user => {
                        promises.push(sendMessage(user.tgchat));
                    });

                    let res = await Promise.all(promises);
                    
                    ctx.reply("Рассылка отправлена!");
                    return ctx.scene.enter('ADMIN_MENU_SCENE');
                } catch (e) {
                    ctx.reply("Ошибка!");
                    console.log(e.message);
                    return ctx.scene.reenter();
                }
            } else {
                if (ctx.session.myData.currentFilter == "deps" || ctx.session.myData.currentFilter == "organizations" || ctx.session.myData.currentFilter == "position") {
                    let wrongInput = false;

                    let currentItems = ctx.message.text.split(',').reduce(function(result, item) {
                        let intNum = parseInt(item.trim());

                        if (!isNaN(intNum)) {
                            result.push(intNum);
                        }
                        return result;
                    }, []);

                    if (currentItems.length == 0) {
                        wrongInput = true;
                    } else {
                        for (let i=0; i<currentItems.length; i++) {
                            if (ctx.session.myData.currentItems.find(item => item.index == currentItems[i]) === undefined) {
                                wrongInput = true;
                            }
                        }
                    }

                    if (wrongInput) {
                        ctx.reply("Неверный ввод!");
                        return;
                    } else {
                        if (ctx.session.myData.currentFilter == "deps") {
                            try {
                                let parentIds = ctx.session.myData.currentItems.filter((item) => currentItems.includes(item.index)).map((item) => {
                                    return item.id;
                                });
    
                                ctx.session.myData.chosenDeps = parentIds;
    
                                let deps = await Department.getSubdivision(parentIds);
                                
                                if (deps.length > 0) {
                                    ctx.session.myData.currentItems = deps.map((item, index) => {
                                        return { id: item.id, index: index }
                                    });
        
                                    ctx.reply(
                                        `Для выбора подразделений наберите номера через запятую:
                                        ${deps.reduce((acc, curr, index) => {
                                            return acc + index.toString() + ": " + curr.name + "\n";
                                        }, '')}`,
                                        Markup.keyboard(["Завершить фильтр", "Отмена"]).oneTime().resize(),
                                    );
                                } else {
                                    ctx.session.myData.filters.department = ctx.session.myData.filters.department.concat(ctx.session.myData.chosenDeps);
    
                                    ctx.session.myData.hasFilters = true;
    
                                    ctx.reply(
                                        "Фильтр добавлен!",
                                        Markup.keyboard(["Добавить фильтр", "Создать сообщение", "Отмена"]).oneTime().resize(),
                                    );
                                }
                            } catch (e) {
                                ctx.reply("Ошибка!");
                                console.log(e.message);
                                return ctx.scene.reenter();
                            }
                        } else if (ctx.session.myData.currentFilter == "organizations" || ctx.session.myData.currentFilter == "position") {
                            let IDs = ctx.session.myData.currentItems.filter((item) => currentItems.includes(item.index)).map((item) => {
                                return item.id;
                            });

                            if (ctx.session.myData.currentFilter == "organizations") {
                                ctx.session.myData.filters.organizations = ctx.session.myData.filters.organizations.concat(IDs);
                            } else {
                                ctx.session.myData.filters.position = ctx.session.myData.filters.position.concat(IDs);
                            }

                            ctx.session.myData.hasFilters = true;

                            ctx.reply(
                                "Фильтр добавлен!",
                                Markup.keyboard(["Добавить фильтр", "Создать сообщение", "Отмена"]).oneTime().resize(),
                            );
                        }
                    }
                }
            }
        });

        return mailingScene;
    }
}

module.exports = SceneGenerator;
