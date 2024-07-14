const { BollingerBands, MACD, Stochastic } = require('technicalindicators');
const { getLogger } = require('../common/logger');
const binance = require('../service/binance');
const feishu = require('../service/feishu');
const utils = require('../common/utils');
const telegram = require('../service/telegram');
const mail = require('../service/mail');
const log = getLogger('binance');

const concurrentSend = utils.createConcurrent(2, 1e3);

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
        if (boll.pb <= 0.1 && macd.MACD <= 0 && kdj.j <= 10) {
            ctx.action = 'buy';
        } else if (boll.pb >= 0.5 && macd.MACD >= 0 && kdj.j >= 100) {
            ctx.action = 'sell';
        }
        if (ctx.action) {
            log.warn(
                '%s %s [%s] indicator: BOLL: %j ,MACD: %j , KDJ: %j',
                symbol,
                interval,
                ctx.action,
                ctx.boll,
                ctx.macd,
                ctx.kdj
            );
            concurrentSend(() => {
                feishu.send({
                    title: ctx.action,
                    content: [
                        [
                            {
                                tag: 'text',
                                text: `BOLL:${JSON.stringify(ctx.boll)}\nMACD:${JSON.stringify(
                                    ctx.macd
                                )}\nKDJ:${JSON.stringify(ctx.kdj)}\n时间：${utils.timestamp()}`,
                            },
                        ],
                    ],
                });
                telegram.send(
                    `<b>${symbol} ${interval} ${ctx.action}: </b>\n<pre>BOLL: ${JSON.stringify(
                        ctx.boll
                    )}</pre>\n<pre>MACD: ${JSON.stringify(ctx.macd)}</pre>\n<pre>KDJ: ${JSON.stringify(
                        ctx.kdj
                    )}</pre>\n`
                );
                mail.send({
                    subject: `Binance: ${symbol} ${interval} ${ctx.action}`, // Subject line
                    html: `<p><code><pre>${JSON.stringify(
                        { BOLL: ctx.boll, MACD: ctx.macd, KDJ: ctx.kdj },
                        null,
                        2
                    )}</pre></code></p>`, // html body
                });
            });
        }

        await next();
    },
    detectPriceChange(ctx, next) {
        // {"eventType":"24hrTicker","eventTime":1720847862334,"symbol":"BNBETH","priceChange":"0.00200000","percentChange":"1.186","averagePrice":"0.17010335","prevClose":"0.16860000","close":"0.17070000","closeQty":"0.01400000","bestBid":"0.17060000","bestBidQty":"52.04300000","bestAsk":"0.17070000","bestAskQty":"2.69200000","open":"0.16870000","high":"0.17120000","low":"0.16840000","volume":"2632.09700000","quoteVolume":"447.72852340","openTime":1720761462334,"closeTime":1720847862334,"firstTradeId":60390397,"lastTradeId":60399160,"numTrades":8764}
        const { symbolMap } = ctx;
        if (symbolMap.size === 0) return;
        const topGainer = [...symbolMap.values()]
            .sort((a, b) => Number(b.percentChange) - Number(a.percentChange))
            .slice(0, 10)
            .map(item => [item.symbol, item.percentChange]);

        ctx.eventName = 'topGainer';
        log.info('%s %j', ctx.eventName, topGainer);
        feishu.send({
            title: ctx.eventName,
            content: [
                [
                    {
                        tag: 'text',
                        text: `${JSON.stringify(topGainer)}\n时间：${utils.timestamp()}`,
                    },
                ],
            ],
        });
        telegram.send(`<b>${ctx.eventName}: </b>\n<pre>${JSON.stringify(topGainer, null, 2)}</pre>`);
    },
};
