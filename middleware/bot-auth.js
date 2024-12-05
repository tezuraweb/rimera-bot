const userAuth = async (ctx, next) => {
    if (ctx.message?.text === '/start') {
        return next();
    }

    if (!ctx.scene?.current) {
        return next();
    }

    if (ctx.scene.current.id === 'AUTH_SCENE') {
        return next();
    }

    if (!ctx.session?.user) {
        return ctx.scene.enter('AUTH_SCENE');
    }

    const adminScenes = ['ADMIN_MENU_SCENE', 'MAILING_SCENE', 'PUBLISH_NEWS_SCENE'];
    if (adminScenes.includes(ctx.scene.current.id) && ctx.session.user.status !== 'admin') {
        await ctx.reply('Доступ запрещен');
        return ctx.scene.enter('MAIN_MENU_SCENE');
    }

    return next();
};

module.exports = userAuth;
