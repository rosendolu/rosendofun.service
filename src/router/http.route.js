const http = require('../middleware/http');

const Router = require('@koa/router');
const router = new Router({
    prefix: '/http',
});
router
    .get('/contentType/:contentType', http.resContentType)
    .get('/res/stream/:streamType', http.resStream)
    .get('/code/:code/:type?', http.resCode);

module.exports = router;
