const { BollingerBands, MACD, Stochastic } = require('technicalindicators');
const { getLogger } = require('../common/logger');
const binance = require('../service/binance');
const utils = require('../common/utils');
const telegram = require('../service/telegram');
const mail = require('../service/mail');
const log = getLogger('binance');
const util = require('node:util');
const { calculateKDJ } = require('../common/finance');

const concurrentSend = utils.createConcurrent(2, () => utils.betweenMinMax(500, 2000));
let sendMap = {};
const throttledSend = async (key, cb) => {
    if (sendMap[key]) return;
    sendMap[key] = 1;
    await concurrentSend(cb);
    await utils.delay(60 * 6e4);
    sendMap[key] = 0;
};

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
        // const stoch = Stochastic.calculate({
        //     high: highs,
        //     low: lows,
        //     close: closes,
        //     period: 9,
        //     signalPeriod: 3,
        // });

        // const K = stoch.map(item => item.k);
        // const D = stoch.map(item => item.d);
        // const J = K.map((k, i) => 3 * k - 2 * D[i]);

        // ctx.KDJ = { K, D, J };
        const KDJ = calculateKDJ(highs, lows, closes, 9);
        ctx.KDJ = KDJ;
        ctx.kdj = { K: KDJ['K'].at(-1), D: KDJ['D'].at(-1), J: KDJ['J'].at(-1) };
        // ctx.kdj = { K: K[K.length - 1], D: D[D.length - 1], J: J[J.length - 1] };
        // { K: 88.59357696566991,D: 73.51245717446496,J: 118.75581654807982,}

        log.debug('%s %s indicator: BOLL: %j ,MACD: %j , KDJ: %j', symbol, interval, ctx.boll, ctx.macd, ctx.kdj);
        await next();
    },
    async matchIndicators(ctx, next) {
        const { kdj, macd, boll, symbol, interval } = ctx;
        if (!kdj || !macd || !boll) return;

        const str = util.format('%s %s : BOLL: %j ,MACD: %j , KDJ: %j', symbol, interval, ctx.boll, ctx.macd, ctx.kdj);

        if (kdj.J <= 0 || boll.pb <= 0) {
            const type = 'OVER_SOLD';
            if (!binance.fluctuation[symbol] || binance.fluctuation[symbol].type !== type) {
                log.info(type + ' ' + str);
            }
            binance.fluctuation[symbol] = { symbol, interval, type, boll, macd, kdj };
            // /usdt$/i.test(symbol) && binance.todoMap.push({ type: 'OVER_SOLD', symbol, interval, boll, macd, kdj });
        } else if (kdj.J >= 100 || boll.pb >= 1) {
            const type = 'OVER_BOUGHT';
            if (!binance.fluctuation[symbol] || binance.fluctuation[symbol].type !== type) {
                log.info(type + ' ' + str);
            }
            binance.fluctuation[symbol] = { symbol, interval, type, boll, macd, kdj };
            // /usdt$/i.test(symbol) && binance.todoMap.push({ type: 'OVER_BOUGHT', symbol, interval, boll, macd, kdj });
        }
        if (boll.pb <= 0 && macd.histogram <= 0 && kdj.J <= 10) {
            ctx.action = 'BUY';
        } else if (boll.pb >= 0.9 && macd.histogram >= 0 && kdj.J >= 100) {
            ctx.action = 'SELL';
        }

        await next();
    },
    async notify(ctx, next) {
        const { symbol, interval, action, boll, kdj, macd } = ctx;

        if (ctx.action) {
            // if (!binance.todoMap[symbol] || binance.todoMap[symbol]?.action !== action) {
            log.warn('%s [%s] boll:%j macd:%j kdj:%j', symbol, ctx.action, boll.pb, macd, kdj);

            throttledSend(`${symbol}-${action}`, async () => {
                const html = `<b>${symbol} ${interval} ${action}: </b>\n<pre>BOLL: ${JSON.stringify(
                    boll
                )}</pre>\n<pre>MACD: ${JSON.stringify(macd)}</pre>\n<pre>KDJ: ${JSON.stringify(kdj)}</pre>\n`;
                await Promise.allSettled([
                    telegram.send(html),
                    mail.send({
                        subject: `Binance: ${symbol} ${interval} ${ctx.action}`, // Subject line
                        html: html, // html body
                    }),
                ]);
            }).catch();
            // }
            binance.todoMap[symbol] = { symbol, interval, action, boll, macd, kdj };
        }
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
        telegram.send(`<b>${ctx.eventName}: </b>\n<pre>${JSON.stringify(topGainer)}</pre>`);
    },
    getServiceState(ctx, next) {
        ctx.body = {
            todo: Object.values(binance.todoMap).sort((a, b) => b.kdj.J - a.kdj.J),
            fluctuation: Object.values(binance.fluctuation).sort((a, b) => b.kdj.J - a.kdj.J),
        };
    },
};
