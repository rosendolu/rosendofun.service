const Router = require('@koa/router');
const router = new Router({
    prefix: '/test',
});
router.all('/', ctx => {
    ctx.body = {
        query: ctx.query,
        params: ctx.params,
        postBody: ctx.request.body,
        session: ctx.session.toJSON(),
    };
});
module.exports = router;
