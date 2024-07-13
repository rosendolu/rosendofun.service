const { BollingerBands, MACD, Stochastic } = require('technicalindicators');
const { getLogger } = require('../common/logger');
const binance = require('../service/binance');
const log = getLogger('binance');

module.exports = {
    async getCandlesticks(ctx, next) {
        const { symbol, interval = '1h' } = ctx;
        await new Promise((resolve, reject) => {
            binance.api.candlesticks(
                symbol,
                interval,
                (error, ticks, symbol) => {
                    if (error) {
                        return reject(error);
                    }
                    ctx.ticks = ticks;
                    // let last_tick = ticks[ticks.length - 1];
                    // log.info('%s %s last close: %j', symbol, interval, last_tick);
                    resolve(1);
                },
                { limit: 50, endTime: Date.now() }
            );
        });
        await next();
    },
    async calculateIndicators(ctx, next) {
        const { symbol, interval } = ctx;
        const len = ctx.ticks.length,
            ticks = ctx.ticks;

        let last_tick = ticks[len - 1];
        // [time,open,high,low,close,volume,closeTime,assetVolume,trades,buyBaseVolume,buyAssetVolume,ignored,]
        const closes = ticks.map(data => parseFloat(data[4]));
        const highs = ticks.map(data => parseFloat(data[2]));
        const lows = ticks.map(data => parseFloat(data[3]));
        ctx.BOLL = BollingerBands.calculate({
            period: 20,
            values: closes,
            stdDev: 2,
        });
        ctx.boll = ctx.BOLL[ctx.BOLL.length - 1];
        // BOLL: {"middle":545.4050000000002,"upper":605.7570496752184,"lower":485.05295032478205,"pb":0.4137974596058109}

        ctx.MACD = MACD.calculate({
            values: closes,
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            SimpleMAOscillator: false,
            SimpleMASignal: false,
        });
        ctx.macd = ctx.MACD[ctx.MACD.length - 1];
        // { MACD: -20.590545983117522,signal: -22.632049483954525,histogram: 2.0415035008370026,}
        const stoch = Stochastic.calculate({
            high: highs,
            low: lows,
            close: closes,
            period: 9,
            signalPeriod: 3,
        });

        const K = stoch.map(item => item.k);
        const D = stoch.map(item => item.d);
        const J = K.map((k, i) => 3 * k - 2 * D[i]);

        ctx.KDJ = { K, D, J };
        ctx.kdj = { K: K[K.length - 1], D: D[D.length - 1], J: J[J.length - 1] };
        // { K: 88.59357696566991,D: 73.51245717446496,J: 118.75581654807982,}

        log.debug('%s %s indicator: BOLL: %j ,MACD: %j , KDJ: %j', symbol, interval, ctx.boll, ctx.macd, ctx.kdj);
        await next();
    },
    async matchIndicators(ctx, next) {
        const { kdj, macd, boll, symbol, interval } = ctx;
        if (boll.pb <= 0.1 && macd.histogram <= 0 && kdj.j <= 10) {
            ctx.action = 'buy';
        } else if (boll.pb >= 0.5 && macd.histogram >= 0 && kdj.j >= 100) {
            ctx.action = 'sell';
        }
        ctx.action &&
            log.warn(
                '%s %s [%s] indicator: BOLL: %j ,MACD: %j , KDJ: %j',
                symbol,
                interval,
                ctx.action,
                ctx.boll,
                ctx.macd,
                ctx.kdj
            );

        await next();
    },
};
