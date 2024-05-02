const dayjs = require('dayjs');
const path = require('path');
const fs = require('fs');
const { v4: uuidV4 } = require('uuid');
const faker = require('chance').Chance();

module.exports = {
    faker,
    timestamp: function timestamp() {
        return dayjs().format('YYYY-MM-DD HH:mm:ss');
    },
    getStaticFile: function getStaticFile(fileName) {
        return fs.createReadStream(path.resolve('static', fileName));
    },
    waitForSeconds: function waitForSeconds(ms = 1e3) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(1);
            }, ms);
        });
    },
    uid: function uid() {
        return uuidV4();
    },
};
