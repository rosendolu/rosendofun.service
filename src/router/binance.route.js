const binance = require('../middleware/binance');

const Router = require('@koa/router');
const router = new Router({
    prefix: '/binance',
});

router.get('/spot/state', binance.getServiceState);
module.exports = router;
