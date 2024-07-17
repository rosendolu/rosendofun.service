const utils = require('../common/utils');

function log(...args) {
    console.log(`[${new Date().toLocaleTimeString()}]:`, ...args);
}
utils.waitFor(async () => {
    await Promise.reject(1);
    log('xx');
}, 3e3);
