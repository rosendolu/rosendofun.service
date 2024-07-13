module.exports = router => {
    router.get('/test/:subpath', ctx => {
        ctx.body = {
            query: ctx.query,
            params: ctx.params,
            postBody: ctx.request.body,
            session: ctx.session.toJSON(),
        };
    });
};
