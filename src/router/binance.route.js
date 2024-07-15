const binance = require('../middleware/binance');

const prefix = '/binance';
module.exports = router => {
    router.all(`${prefix}/spot/state`, binance.getServiceState);
};
