const dayjs = require('dayjs');
const path = require('path');
const fs = require('fs');

module.exports = {
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
    uid: async function uid(len = 16) {
        const { nanoid } = await import('nanoid');
        return nanoid(len);
    },
};
