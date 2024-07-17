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
module.exports = { calculateKDJ };
