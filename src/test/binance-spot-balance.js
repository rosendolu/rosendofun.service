const { getLogger } = require('../common/logger');
const { waitFor, delay } = require('../common/utils');
const { getCandlesticks, calculateIndicators, matchIndicators, notify } = require('../middleware/binance');
const binance = require('../service/binance');
const log = getLogger();

binance.use('spot/candlesticks', getCandlesticks, calculateIndicators, matchIndicators, (ctx, next) => {
    let action = '';
    if (ctx.boll.pb >= 1 && ctx.macd.histogram > 0 && ctx.kdj.J >= 100) {
        action = 'SELL';
    }
    if (ctx.boll.pb <= 0 && ctx.macd.histogram <= 0 && ctx.kdj.J <= 0) {
        action = 'BUY';
    }
    action && log.warn('%s %s %j %j %j', action, ctx.symbol, ctx.boll, ctx.macd, ctx.kdj);
});

main();
async function main() {
    try {
        binance.api.balance(async (error, balances) => {
            if (error) {
                return log.error(error?.body || error);
            }
            let result = {};
            Object.keys(balances).forEach(key => {
                const num = parseFloat(balances[key].available) + parseFloat(balances[key].onOrder);
                if (num > 0) {
                    result[key] = num;
                }
            });

            log.info('Binance balance %O', result);
            await waitFor(async () => {
                for (const symbol of Object.keys(result)) {
                    log.info('%s %j', symbol, result[symbol]);
                    await binance.trigger('spot/candlesticks', { symbol: symbol + 'USDT', interval: '1d' });
                    await delay(300);
                }
                return 1;
            }, 3e3);

            const iter = [...binance.symbolFilters.keys()];
            log.debug('Traverse all symbols %s', iter.length);

            if (iter.length === 0) return;
            await waitFor(async () => {
                for (const symbol of iter) {
                    if (!/usdt$/i.test(symbol)) continue;
                    log.debug('%s', symbol);
                    await binance.trigger('spot/candlesticks', { symbol: symbol, interval: '1d' });
                    await delay(300);
                }
                return 1;
            }, 3e3);
            log.debug('Done!');
        });
    } catch (err) {
        console.error('err:', err);
    }
}
