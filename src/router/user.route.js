const user = require('../middleware/user');

const prefix = '/user';
module.exports = router => {
    router
        .all('userLogin', `${prefix}/login`, user.userLogin)
        .all('userLogout', `${prefix}/logout`, user.userLogout)
        .all('userInfo', `${prefix}/info`, user.userInfo)
        .all('adminAuth', `${prefix}/auth`, user.adminAuth);
};
