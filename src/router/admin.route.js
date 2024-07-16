const { serveTempDir } = require('../middleware/file');
const { adminRouterAuth } = require('../middleware/user');

const Router = require('@koa/router');

const router = new Router({
    prefix: '/admin',
});

// glob pattern https://github.com/pillarjs/path-to-regexp
router.all('/', adminRouterAuth).get('/temp/(.*)', serveTempDir);

module.exports = router;
