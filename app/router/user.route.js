const user = require('../middleware/user');

const prefix = '/user';
module.exports = router => {
    router
        .all('userLogin', `${prefix}/login`, user.userLogin)
        .all('userInfo', `${prefix}/info`, user.userInfo)
        .all('adminAuth', `${prefix}/auth`, user.adminAuth);
};
