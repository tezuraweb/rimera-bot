const { Scenes, Markup } = require('telegraf');
const User = require('./models/User');
const News = require('./models/News');
const Department = require('./models/Department');
const Mailing = require('./models/Mailing');
const Appeal = require('./models/Appeal');

class SceneGenerator {
    AuthScene() {
        const authScene = new Scenes.BaseScene('AUTH_SCENE');

        authScene.enter(async (ctx) => {
            try {
                let user = await User.getUser(ctx.from.id);

                if (user) {
                    if (user.status == 'fired') {
                        ctx.reply("Вам отказано в доступе!");
                    } else {
                        ctx.reply("Добро пожаловать, " + user.name + "!");

                        if (user.status == 'admin') {
                            return ctx.scene.enter('ADMIN_MENU_SCENE');
                        } else {
                            return ctx.scene.enter('MAIN_MENU_SCENE');
                        }
                    }
                } else {
                    ctx.reply("Добро пожаловать! Для регистрации отправьте номер телефона или табельный номер");
                }
            } catch (e) {
                ctx.reply("Ошибка!");
                console.log(e.message);
            }
        });

        authScene.command('start', (ctx) => {
            ctx.scene.reenter();
        });

        authScene.on("message", async (ctx) => {
            try {
                let number = ctx.message.text.trim();
                let user = await User.getByNumber(number);

                if (user) {
                    if (user) {
                        if (user.status == 'fired') {
                            ctx.reply("Вам отказано в доступе!");
                        } else {
                            user = await User.signIn(user.id, ctx.from.id, ctx.from.username);
                            ctx.reply("Добро пожаловать, " + user.name + "!");

                            if (user.status == 'admin') {
                                return ctx.scene.enter('ADMIN_MENU_SCENE');
                            } else {
                                return ctx.scene.enter('MAIN_MENU_SCENE');
                            }
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
                Markup.keyboard(["Предложить новость", "Обратная связь"]).oneTime().resize(),
            );
        });

        menuScene.hears("Предложить новость", (ctx) => {
            return ctx.scene.enter('ADD_NEWS_SCENE');
        });

        menuScene.hears("Обратная связь", (ctx) => {
            return ctx.scene.enter('FEEDBACK_SCENE');
        });

        return menuScene;
    }

    FeedbackScene() {
        const feedbackScene = new Scenes.BaseScene('FEEDBACK_SCENE');

        feedbackScene.enter((ctx) => {
            ctx.session.myData = {
                type: '',
            };

            ctx.reply(
                "Выберите пункт меню:",
                Markup.keyboard(["Предложить улучшение", "Сообщить о проблеме", "Назад"]).oneTime().resize(),
            );
        });

        feedbackScene.hears("Предложить улучшение", (ctx) => {
            ctx.session.myData.type = 'feature';

            ctx.reply(
                "Напишите, что вы хотели бы улучшить. В ближайшее время вам ответит администратор",
                Markup.keyboard(["Отмена"]).oneTime().resize(),
            );
        });

        feedbackScene.hears("Сообщить о проблеме", (ctx) => {
            ctx.session.myData.type = 'problem';

            ctx.reply(
                "Опишите вашу проблему. В ближайшее время вам ответит администратор",
                Markup.keyboard(["Отмена"]).oneTime().resize(),
            );
        });

        feedbackScene.hears("Назад", (ctx) => {
            return ctx.scene.enter('MAIN_MENU_SCENE');
        });

        feedbackScene.hears("Отмена", (ctx) => {
            return ctx.scene.reenter();
        });

        feedbackScene.on("message", async (ctx) => {
            if (ctx.message.text == '') {
                ctx.reply(
                    "Задайте текст обращения!",
                    Markup.keyboard(["Отмена"]).oneTime().resize(),
                );
            } else {
                try {
                    let user = await User.getUser(ctx.from.id);

                    let appeal = await Appeal.create(user.id, ctx.message.text, ctx.session.myData.type);

                    user = await User.getUserByDuty(ctx.session.myData.type);

                    if (user) {
                        if (ctx.session.myData.type == 'problem') {
                            ctx.telegram.sendMessage(user.tgchat, 'Поступила новая жалоба от пользователя!');
                        } else if (ctx.session.myData.type == 'feature') {
                            ctx.telegram.sendMessage(user.tgchat, 'Поступило новое предложение от пользователя!');
                        }
                    }
                } catch (e) {
                    ctx.reply("Ошибка!");
                    console.log(e.message);
                    return ctx.scene.reenter();
                }
            }

            ctx.reply("Ваше обращение зарегистрировано!");

            return ctx.scene.enter('MAIN_MENU_SCENE');
        });

        return feedbackScene;
    }

    AdminMenuScene() {
        const adminMenuScene = new Scenes.BaseScene('ADMIN_MENU_SCENE');

        adminMenuScene.enter((ctx) => {
            ctx.reply(
                "Выберите пункт меню:",
                Markup.keyboard(["Предложить новость", "Создать рассылку", "Обращения"]).oneTime().resize(),
            );
        });

        adminMenuScene.hears("Предложить новость", (ctx) => {
            return ctx.scene.enter('ADD_NEWS_SCENE');
        });

        adminMenuScene.hears("Создать рассылку", (ctx) => {
            return ctx.scene.enter('MAILING_SCENE');
        });

        adminMenuScene.hears("Обращения", (ctx) => {
            return ctx.scene.enter('APPEAL_SCENE');
        });

        adminMenuScene.hears("Назад", (ctx) => {
            return ctx.scene.enter('ADMIN_MENU_SCENE');
        });

        return adminMenuScene;
    }

    AppealScene() {
        const appealScene = new Scenes.BaseScene('APPEAL_SCENE');

        appealScene.enter((ctx) => {
            ctx.session.myData = {
                list: null,
                count: 0,
                index: -1,
            };

            ctx.reply(
                "Выберите пункт меню:",
                Markup.keyboard(["Предложения", "Жалобы", "Назад"]).oneTime().resize(),
            );
        });

        appealScene.hears("Предложения", async (ctx) => {
            try {
                ctx.session.myData.list = await Appeal.getFeatures();
                ctx.session.myData.count = ctx.session.myData.list.length;

                if (ctx.session.myData.index + 1 < ctx.session.myData.count) {
                    ctx.reply(
                        `Обращений: ${ctx.session.myData.count}`,
                        Markup.keyboard(["Показать следующее обращение", "Назад"]).oneTime().resize(),
                    );
                } else {
                    ctx.reply(
                        `Обращений: ${ctx.session.myData.count}`,
                        Markup.keyboard(["Назад"]).oneTime().resize(),
                    );
                }
            } catch (e) {
                ctx.reply("Ошибка!");
                console.log(e.message);
                return ctx.scene.enter('ADMIN_MENU_SCENE');
            }
        });

        appealScene.hears("Жалобы", async (ctx) => {
            try {
                ctx.session.myData.list = await Appeal.getProblems();
                ctx.session.myData.count = ctx.session.myData.list.length;

                if (ctx.session.myData.index + 1 < ctx.session.myData.count) {
                    ctx.reply(
                        `Обращений: ${ctx.session.myData.count}`,
                        Markup.keyboard(["Показать следующее обращение", "Назад"]).oneTime().resize(),
                    );
                } else {
                    ctx.reply(
                        `Обращений: ${ctx.session.myData.count}`,
                        Markup.keyboard(["Назад"]).oneTime().resize(),
                    );
                }
            } catch (e) {
                ctx.reply("Ошибка!");
                console.log(e.message);
                return ctx.scene.enter('ADMIN_MENU_SCENE');
            }
        });

        appealScene.hears("Показать следующее обращение", async (ctx) => {
            try {
                ctx.session.myData.index += 1;

                let content = ctx.session.myData.list[ctx.session.myData.index];
                let user = await User.getUserById(content.creator);
                ctx.reply(content.text);

                if (ctx.session.myData.index + 1 < ctx.session.myData.count) {
                    ctx.reply(
                        `Автор обращения: ${user.name} (@${user.tgid})`,
                        Markup.keyboard(["Ответить на обращение", "Показать следующее обращение", "Назад"]).oneTime().resize(),
                    );
                } else {
                    ctx.reply(
                        `Автор обращения: ${user.name} (@${user.tgid})`,
                        Markup.keyboard(["Ответить на обращение", "Назад"]).oneTime().resize(),
                    );
                }
            } catch (e) {
                ctx.reply("Не удалось отобразить сообщение!");
                console.log(e.message);
                return ctx.scene.reenter();
            }
        });

        appealScene.hears("Ответить на обращение", (ctx) => {
            ctx.reply(
                "Напишите сообщение, при необходимости добавьте медиа-файлы. После отправки ответ будет отправлен пользователю от лица бота.",
                Markup.keyboard(["Отмена"]).oneTime().resize(),
            );
        });

        appealScene.hears("Назад", (ctx) => {
            return ctx.scene.enter('ADMIN_MENU_SCENE');
        });

        appealScene.hears("Отмена", (ctx) => {
            return ctx.scene.reenter();
        });

        appealScene.on("message", async (ctx) => {
            try {
                let content = ctx.session.myData.list[ctx.session.myData.index];
                let user = await User.getUserById(content.creator);

                if (user.tgchat !== null) {
                    ctx.telegram.sendMessage(user.tgchat, 'Ответ на ваше обращение от администратора:');
                    ctx.copyMessage(user.tgchat);
                    await Appeal.delete(content.id);
                }
            } catch (e) {
                ctx.reply("Ошибка!");
                console.log(e.message);
                return ctx.scene.enter('ADMIN_MENU_SCENE');
            }

            ctx.reply("Ответ пользователю успешно отправлен!");
            return ctx.scene.enter('ADMIN_MENU_SCENE');
        });

        return appealScene;
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

                    ctx.reply("Новость добавлена в предложку!");

                    if (user.status == 'admin') {
                        return ctx.scene.enter('ADMIN_MENU_SCENE');
                    } else {
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

    MailingScene() {
        const mailingScene = new Scenes.BaseScene('MAILING_SCENE');

        mailingScene.enter(async (ctx) => {
            ctx.session.myData = {
                newsList: [],
                mailingList: [],
                newsCount: 0,
                newsIndex: -1,
                newsId: -1,
                mailingId: -1,
                inbox: false,
                mode: 'init',
            };

            ctx.reply(
                "Выберите пункт меню",
                Markup.keyboard(["Мгновенная рассылка", "Предложка новостей", "Назад"]).oneTime().resize(),
            );
        });

        mailingScene.hears("Мгновенная рассылка", (ctx) => {
            ctx.reply(
                "Выберите опцию",
                Markup.keyboard(["Отправить всем", "Выбрать рассылку", "Отмена"]).oneTime().resize(),
            );
        });

        mailingScene.hears("Предложка новостей", async (ctx) => {
            ctx.session.myData.inbox = true;

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
                ctx.reply("Ошибка!");
                console.log(e.message);
                return ctx.scene.enter('ADMIN_MENU_SCENE');
            }
        });

        mailingScene.hears("Показать следующую новость", async (ctx) => {
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
                        `Автор новости: ${user.name} (@${user.tgid})`,
                        Markup.keyboard(["Выбрать новость", "Показать следующую новость", "Назад"]).oneTime().resize(),
                    );
                } else {
                    ctx.reply(
                        `Автор новости: ${user.name} (@${user.tgid})`,
                        Markup.keyboard(["Выбрать новость", "Назад"]).oneTime().resize(),
                    );
                }
            } catch (e) {
                ctx.reply("Не удалось отобразить сообщение!");
                console.log(e.message);
                return ctx.scene.reenter();
            }
        });

        mailingScene.hears("Выбрать новость", (ctx) => {
            ctx.session.myData.newsId = ctx.session.myData.newsList[ctx.session.myData.newsIndex].id;
            ctx.reply(
                "Новость выбрана!\nВыберите опцию",
                Markup.keyboard(["Отправить всем", "Выбрать рассылку", "Отмена"]).oneTime().resize(),
            );
        });

        mailingScene.hears("Выбрать рассылку", async (ctx) => {
            ctx.session.myData.mode = 'mailing';

            try {
                let mailings = await Mailing.getAll();

                ctx.session.myData.mailingList = mailings.map((item, index) => {
                    return { id: item.id, index: index }
                });

                ctx.reply(
                    `Для выбора рассылки наберите номер:\n
                    ${mailings.reduce((acc, curr, index) => {
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

        mailingScene.hears("Отправить всем", async (ctx) => {
            ctx.session.myData.mode = 'send';

            if (ctx.session.myData.inbox) {
                const res = await publishNews(ctx);

                if (res) {
                    ctx.reply(
                        "Сообщение успешно опубликовано!",
                        Markup.keyboard(["Назад"]).oneTime().resize(),
                    );
                } else {
                    ctx.reply("Не удалось опубликовать сообщение!");
                    return ctx.scene.reenter();
                }
            } else {
                ctx.reply(
                    "Напишите сообщение, при необходимости добавьте медиа-файлы. После отправки сообщение будет разослано отфильтрованным пользователям",
                    Markup.keyboard(["Отмена"]).oneTime().resize(),
                );
            }
        });

        mailingScene.hears("Опубликовать новость", async (ctx) => {
            if (ctx.session.myData.inbox) {
                const res = await publishNews(ctx);
                
                if (res) {
                    ctx.reply(
                        "Сообщение успешно опубликовано!",
                        Markup.keyboard(["Назад"]).oneTime().resize(),
                    );
                } else {
                    ctx.reply("Не удалось опубликовать сообщение!");
                    return ctx.scene.reenter();
                }
            }
        });

        mailingScene.hears("Назад", (ctx) => {
            return ctx.scene.enter('ADMIN_MENU_SCENE');
        });

        mailingScene.hears("Отмена", (ctx) => {
            return ctx.scene.reenter();
        });

        mailingScene.on("message", async (ctx) => {
            if (ctx.session.myData.mode == 'send') {
                try {
                    let users = [];
                    // let channels = [];
                    let mailing = [];
                    let promises = [];

                    if (ctx.session.myData.mailingId > 0) {
                        mailing = await Mailing.getById(ctx.session.myData.mailingId);
                        if (mailing.user_filter !== null && mailing.user_filter.length > 0) {
                            users = await User.getUsersByIds(mailing.user_filter);
                        } else {
                            let filter = {
                                organization: mailing.organization_filter,
                                department: mailing.department_filter,
                                position: mailing.position_filter,
                                gender: mailing.gender_filter,
                            }

                            var deps = [];
                            if (filter.department !== null && filter.department.length > 0) {
                                deps = await Department.getSubdivisionMultiple(filter.department);
                            }
                            while (deps !== null && deps.length > 0) {
                                let depsIds = deps.map((item) => {
                                    return item.id;
                                });

                                filter.department = [...filter.department, ...depsIds];
                                deps = await Department.getSubdivisionMultiple(depsIds);
                            }

                            users = await User.getUsersWithFilter(filter);

                            // if (mailing.channels !== null && mailing.channels.length > 0) {
                            //     channels = mailing.channels;
                            // }
                        }
                    } else {
                        users = await User.getAll();
                    }

                    function sendMessage(chatId) {
                        return new Promise((resolve) => {
                            if (ctx.message.poll) {
                                ctx.forwardMessage(chatId);
                            } else {
                                ctx.copyMessage(chatId);
                            }

                            resolve(chatId);
                        });
                    }
                    
                    users.forEach(user => {
                        if (user.tgchat !== null) {
                            promises.push(sendMessage(user.tgchat));
                        }
                    });

                    // channels.forEach(channel => {
                    //     promises.push(sendMessage(channel));
                    // });

                    const res = await Promise.all(promises);
                    
                    ctx.reply("Рассылка отправлена!");
                    return ctx.scene.enter('ADMIN_MENU_SCENE');
                } catch (e) {
                    ctx.reply("Ошибка!");
                    console.log(e.message);
                    return ctx.scene.reenter();
                }
            } else if (ctx.session.myData.mode == 'mailing') {
                const mailingIndex = parseInt(ctx.message.text.trim());
                let wrongInput = false;

                if (!isNaN(mailingIndex)) {
                    const mailingId = ctx.session.myData.mailingList.find(item => item.index == mailingIndex);

                    if (mailingId === undefined) {
                        wrongInput = true;
                    } else {
                        ctx.session.myData.mailingId = mailingId.id;
                    }
                } else {
                    wrongInput = true;
                }

                if (wrongInput) {
                    ctx.reply(
                        "Неверный ввод! Попробуйте еще раз.",
                        Markup.keyboard(["Отмена"]).oneTime().resize(),
                    );
                } else {
                    ctx.session.myData.mode = 'send';

                    if (ctx.session.myData.inbox) {
                        ctx.reply(
                            "Рассылка выбрана!",
                            Markup.keyboard(["Опубликовать новость", "Отмена"]).oneTime().resize(),
                        );
                    } else {
                        ctx.reply(
                            "Рассылка выбрана!\nНапишите сообщение, при необходимости добавьте медиа-файлы. После отправки сообщение будет разослано отфильтрованным пользователям.",
                            Markup.keyboard(["Отмена"]).oneTime().resize(),
                        );
                    }
                    
                }
            }
        });

        async function publishNews(ctx) {
            try {
                const content = ctx.session.myData.newsList[ctx.session.myData.newsIndex];
                let users = [];
                // let channels = [];
                let mailing = [];
                let promises = [];

                if (ctx.session.myData.mailingId > 0) {
                    mailing = await Mailing.getById(ctx.session.myData.mailingId);
                    if (mailing.user_filter !== null && mailing.user_filter.length > 0) {
                        users = await User.getUsersByIds(mailing.user_filter);
                    } else {
                        let filter = {
                            organization: mailing.organization_filter,
                            department: mailing.department_filter,
                            position: mailing.position_filter,
                            gender: mailing.gender_filter,
                        }

                        var deps = [];
                        if (filter.department !== null && filter.department.length > 0) {
                            deps = await Department.getSubdivisionMultiple(filter.department);
                        }
                        while (deps !== null && deps.length > 0) {
                            let depsIds = deps.map((item) => {
                                return item.id;
                            });

                            filter.department = [...filter.department, ...depsIds];
                            deps = await Department.getSubdivisionMultiple(depsIds);
                        }

                        users = await User.getUsersWithFilter(filter);

                        // if (mailing.channels !== null && mailing.channels.length > 0) {
                        //     channels = mailing.channels;
                        // }
                    }
                } else {
                    users = await User.getAll();
                }

                function sendMessage(chatId) {
                    return new Promise((resolve) => {
                        if (content.files.length > 0) {
                            ctx.telegram.sendMediaGroup(chatId, content.files.map((item, index) => {
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
                            ctx.telegram.sendMessage(chatId, content.text);
                        }

                        resolve(chatId);
                    });
                }
                
                users.forEach(user => {
                    if (user.tgchat !== null) {
                        promises.push(sendMessage(user.tgchat));
                    }
                });

                // channels.forEach(channel => {
                //     promises.push(sendMessage(channel));
                // });

                const res = await Promise.all(promises);

                if (content.status == 'disposable') {
                    await News.deleteNews(content.id);
                }

                return true;
            } catch (e) {
                console.log(e.message);
                return false;
            }
        }

        return mailingScene;
    }
}

module.exports = SceneGenerator;
