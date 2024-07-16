const Binance = require('node-binance-api');
const CreateCompose = require('../common/useCompose');
const { getLogger } = require('../common/logger');
const { isProdEnv } = require('../common/constant');
const log = getLogger('binance');
const binance = new Binance().options(
    {
        // urls: {
        //     base: 'https://api.binance.us/api/',
        //     stream: 'wss://stream.binance.us:9443/ws/',
        //     combineStream: 'wss://stream.binance.us:9443/stream?streams=',
        // },
        useServerTime: true,
        reconnect: true,
        verbose: isProdEnv ? false : true,
        family: 4,
        log: (...params) => log.debug(params),
        APIKEY: process.env.BINANCE_APIKEY,
        APISECRET: process.env.BINANCE_APISECRET,
    },
    () => {
        log.info('Binance Service: %j', binance.getInfo());
    }
);

process.on('beforeExit', () => {
    // List all endpoints
    const endpoints = binance.websockets.subscriptions();
    for (let endpoint in endpoints) {
        binance.websockets.terminate(endpoint);
    }
});
class Service extends CreateCompose {
    constructor() {
        super();
        this.todoList = [];
        this.api = binance;
        this.symbolMap = new Map();
        this.symbolFilters = new Map();
        this.rateLimits = [];
        this.balances = {};
        // this.exchangeFilters = []
        this.init();
    }
    async init() {
        // binance.balance((error, balances) => {
        //     if (error) {
        //         return log.error(error?.body || error);
        //     }
        //     //
        //     Object.keys(balances).forEach(key => {
        //         const obj = balances[key].available;
        //         if (parseFloat(obj) > 0) {
        //             this.balances[key] = obj;
        //         }
        //     });

        //     log.info('Binance balance %j', this.balances);
        // });
        // const res = await this.api.openOrders(false);
        // log.info('Open orders %j', res);
        this.api.websockets.prevDay(false, (error, res) => {
            if (error) {
                return log.error('prevDay %s', error.toString());
            }
            // {"eventType":"24hrTicker","eventTime":1720847862334,"symbol":"BNBETH","priceChange":"0.00200000","percentChange":"1.186","averagePrice":"0.17010335","prevClose":"0.16860000","close":"0.17070000","closeQty":"0.01400000","bestBid":"0.17060000","bestBidQty":"52.04300000","bestAsk":"0.17070000","bestAskQty":"2.69200000","open":"0.16870000","high":"0.17120000","low":"0.16840000","volume":"2632.09700000","quoteVolume":"447.72852340","openTime":1720761462334,"closeTime":1720847862334,"firstTradeId":60390397,"lastTradeId":60399160,"numTrades":8764}
            this.symbolMap.set(res.symbol, res);
            // log.info('spot symbols %s', list.length);
        });
        // this.api.prevDay(false, (error, prevDay) => {
        //     if (error) {
        //         log.error('prevDay %s', error.toString());
        //         return;
        //     }
        //     let symbolSet = new Set();
        //     for (let obj of prevDay) {
        //         let symbol = obj.symbol;
        //         this.symbolMap.set(symbol, obj);
        //         symbolSet.add(symbol);
        //     }
        //     log.info('prevDay symbols %s', symbolSet.size);
        //     // https://binance-docs.github.io/apidocs/spot/cn/#12907e94be
        //     this.api.websockets.candlesticks([...symbolSet].slice(0, 100), '1d', candlestickData => {
        //         let tick = binance.last(candlestickData);
        //         const symbol = candlestickData.s;
        //         const close = candlestickData[tick].c;
        //     });
        // });
        this.api.exchangeInfo((error, data) => {
            if (error) {
                return log.error('exchangeInfo %s', error.body || error);
            }
            // {rateLimitType: 'REQUEST_WEIGHT', interval: 'MINUTE', intervalNum: 1, limit: 6000}
            this.rateLimits = data.rateLimits;
            // this.exchangeFilters =data.exchangeFilters
            for (let obj of data.symbols) {
                let filters = { status: obj.status };
                for (let filter of obj.filters) {
                    if (filter.filterType == 'MIN_NOTIONAL') {
                        filters.minNotional = filter.minNotional;
                    } else if (filter.filterType == 'PRICE_FILTER') {
                        filters.minPrice = filter.minPrice;
                        filters.maxPrice = filter.maxPrice;
                        filters.tickSize = filter.tickSize;
                    } else if (filter.filterType == 'LOT_SIZE') {
                        filters.stepSize = filter.stepSize;
                        filters.minQty = filter.minQty;
                        filters.maxQty = filter.maxQty;
                    }
                }
                //filters.baseAssetPrecision = obj.baseAssetPrecision;
                //filters.quoteAssetPrecision = obj.quoteAssetPrecision;
                filters.orderTypes = obj.orderTypes;
                filters.icebergAllowed = obj.icebergAllowed;
                obj.status === 'TRADING' && this.symbolFilters.set(obj.symbol, filters);
            }
            log.info('exchangeInfo: %s', this.symbolFilters.size);

            // global.filters = minimums;
            //fs.writeFile("minimums.json", JSON.stringify(minimums, null, 4), function(err){});
        });
    }
    usedWeight() {
        const binance = this.api;
        const max = this.rateLimits.find(item => item.rateLimitType === 'REQUEST_WEIGHT')?.limit || 0;
        const used = binance.usedWeight();
        if (used >= max || max - used <= 30) {
            log.warn(
                '%s',
                `statusCode: ${binance.statusCode()} usedWeight:${binance.usedWeight()} / ${max}  ${binance.lastURL()}`
            );
        }
    }
}

module.exports = new Service();
