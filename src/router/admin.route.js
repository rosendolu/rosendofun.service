const { adminRouterAuth } = require('../middleware/user');

const prefix = '/admin';
module.exports = router => {
    router.all(`${prefix}`, adminRouterAuth);
};
