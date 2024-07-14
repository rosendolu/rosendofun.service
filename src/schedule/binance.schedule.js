const { CronJob } = require('cron');
const { getCandlesticks, calculateIndicators, matchIndicators, detectPriceChange } = require('../middleware/binance');
const binance = require('../service/binance');
const { getLogger } = require('../common/logger');
const utils = require('../common/utils');
const dayjs = require('dayjs');
const log = getLogger('binance');

// candlestick indicator
binance.use('spot/candlesticks', getCandlesticks, calculateIndicators, matchIndicators);
let runner = utils.createConcurrent(3, () => utils.betweenMinMax(3, 6) * 1e2);
utils.waitFor(
    async function () {
        // Intervals: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
        const iter = [...binance.symbolFilters.keys()];
        if (iter.length === 0) return;
        // const iter = ['BNBUSDT'];
        let start = dayjs();
        log.info('start calculate %s', iter.length);

        await Promise.allSettled(
            iter.map(symbol =>
                runner(async () => {
                    await binance.trigger('spot/candlesticks', { symbol, interval: '1d' });
                    binance.usedWeight();
                })
            )
        );

        log.info('calculated %s symbols %s', iter.length, utils.displayDuration(start));
    },
    () => 15 * 6e4
);

// spot/24hrTicker
binance.use('spot/24hrTicker', detectPriceChange);
utils.waitFor(
    async function () {
        binance.trigger('spot/24hrTicker', { symbolMap: binance.symbolMap });
    },
    () => 60 * 6e4
);
