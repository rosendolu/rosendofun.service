const { CronJob } = require('cron');
const { getCandlesticks, calculateIndicators, matchIndicators } = require('../middleware/binance');
const binance = require('../service/binance');
const { getLogger } = require('../common/logger');
const utils = require('../common/utils');
const dayjs = require('dayjs');
const { start } = require('repl');
const log = getLogger('binance');

binance.use('spot/candlesticks', getCandlesticks, calculateIndicators, matchIndicators);

let runner = utils.createConcurrent(5, () => utils.betweenMinMax(1, 3) * 1e2);
utils.waitFor(
    async function () {
        // Intervals: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
        const iter = [...binance.symbolMap.keys()];
        // const iter = ['BNBUSDT'];
        let start = dayjs();
        log.info('symbol size %s', iter.length);

        await Promise.allSettled(
            iter.map(symbol =>
                runner(async () => {
                    await binance.trigger('spot/candlesticks', { symbol, interval: '1d' });
                    binance.usedWeight();
                })
            )
        );

        log.info('calculate %s symbols %s', iter.length, utils.displayDuration(start));
    },
    () => 15 * 6e4
);
// new CronJob(
//     '15 * * * * *', // cronTime
//     async function () {
//         // Intervals: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
//         const iter = binance.symbolMap.keys();
//         log.info('symbol size %s',binance.symbolMap.size)
//         for (const symbol of iter) {
//             await binance.trigger('spot/candlesticks', { symbol, interval: '1d' });
//             await utils.delay
//         }
//     }, // onTick
//     null, // onComplete
//     true // start
// );
