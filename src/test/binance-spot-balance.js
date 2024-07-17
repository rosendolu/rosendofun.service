const { getLogger } = require('../common/logger');
const { waitFor, delay } = require('../common/utils');
const { getCandlesticks, calculateIndicators, matchIndicators, notify } = require('../middleware/binance');
const binance = require('../service/binance');
binance.use('spot/candlesticks', getCandlesticks, calculateIndicators, matchIndicators, notify);

const log = getLogger('binance');
main();
async function main() {
    try {
        binance.api.balance(async (error, balances) => {
            if (error) {
                return log.error(error?.body || error);
            }
            let result = {};
            Object.keys(balances).forEach(key => {
                const obj = balances[key].available;
                if (parseFloat(obj) > 0) {
                    result[key] = obj;
                }
            });

            log.info('Binance balance %O', result);
            waitFor(async () => {
                for (const symbol of Object.keys(result)) {
                    log.info('%s %j', symbol, result[symbol]);
                    await binance.trigger('spot/candlesticks', { symbol: symbol + 'USDT', interval: '1d' });
                    await delay(3e3);
                }
                return 1;
            }, 3e3);
        });
    } catch (err) {
        console.error('err:', err);
    }
}
