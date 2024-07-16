const user = require('../middleware/user');

const Router = require('@koa/router');
const router = new Router({
    prefix: '/user',
});

router
    .all('userLogin', '/login', user.userLogin)
    .all('userLogout', '/logout', user.userLogout)
    .all('userInfo', '/info', user.userInfo)
    .all('adminAuth', '/auth', user.adminAuth);

module.exports = router;
