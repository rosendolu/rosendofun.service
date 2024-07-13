const fileMiddleware = require('../middleware/file');

const prefix = '/file';
module.exports = router => {
    router.post(`${prefix}/upload`, fileMiddleware.uploadFile).get(`${prefix}/list`, fileMiddleware.listFile);
};
