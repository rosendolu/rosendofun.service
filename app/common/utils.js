const dayjs = require('dayjs');

module.exports = {
    timestamp: function timestamp() {
        return dayjs().format('YYYY-MM-DD HH:mm:ss');
    },
};
