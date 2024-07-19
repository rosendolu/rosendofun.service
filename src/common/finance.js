function calculateKDJ(highs, lows, closes, period = 9) {
    let kValues = [];
    let dValues = [];
    let jValues = [];

    let k = 50; // Initial K value
    let d = 50; // Initial D value

    for (let i = period - 1; i < closes.length; i++) {
        let highestHigh = Math.max(...highs.slice(i - period + 1, i + 1));
        let lowestLow = Math.min(...lows.slice(i - period + 1, i + 1));
        let close = closes[i];

        let rsv = ((close - lowestLow) / (highestHigh - lowestLow)) * 100;
        k = (2 / 3) * k + (1 / 3) * rsv;
        d = (2 / 3) * d + (1 / 3) * k;
        let j = 3 * k - 2 * d;

        kValues.push(k);
        dValues.push(d);
        jValues.push(j);
    }

    return { K: kValues, D: dValues, J: jValues };
}

// Helper functions
function sma(values, period) {
    return values.slice(period).map((_, i) => values.slice(i, i + period).reduce((acc, val) => acc + val, 0) / period);
}

function calculateRSI(prices, period = 14) {
    let gains = [];
    let losses = [];

    for (let i = 1; i < prices.length; i++) {
        let change = prices[i] - prices[i - 1];
        if (change > 0) {
            gains.push(change);
            losses.push(0);
        } else {
            gains.push(0);
            losses.push(-change);
        }
    }

    let avgGain = sma(gains, period).slice(-1)[0];
    let avgLoss = sma(losses, period).slice(-1)[0];

    let rs = avgGain / avgLoss;
    let rsi = 100 - 100 / (1 + rs);

    return rsi;
}

module.exports = { calculateKDJ, sma, calculateRSI };
