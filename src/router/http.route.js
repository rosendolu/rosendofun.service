const http = require('../middleware/http');

const prefix = '/http';
module.exports = router => {
    router
        .get(`${prefix}/contentType/:contentType`, http.resContentType)
        .get(`${prefix}/res/stream/:streamType`, http.resStream)
        .get(`${prefix}/code/:code/:type?`, http.resCode);
};
