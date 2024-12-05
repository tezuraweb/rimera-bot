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