module.exports = router => {
    router.all('/test', ctx => {
        ctx.body = {
            query: ctx.query,
            params: ctx.params,
            postBody: ctx.request.body,
            session: ctx.session.toJSON(),
        };
    });
};
