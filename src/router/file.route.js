const fileMiddleware = require('../middleware/file');

const Router = require('@koa/router');
const router = new Router({
    prefix: '/file',
});

router.post('/upload', fileMiddleware.uploadFile).get('/list', fileMiddleware.listFile);
module.exports = router;
