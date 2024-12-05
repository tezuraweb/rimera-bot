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