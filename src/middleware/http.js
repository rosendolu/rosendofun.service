const fs = require('fs');
const path = require('path');
const { getStaticFile } = require('../common/utils');
const { logger } = require('../common/logger');
const utils = require('../common/utils');
const JSONStream = require('../common/jsonStream');
const { rootDir } = require('../common/constant');
const { assert } = require('console');

module.exports = {
    resCode(ctx, next) {
        let { code, type } = ctx.params;
        code = ~~code;
        assert(typeof code === 'number');

        ctx.status = code;
        switch (code) {
            case 401:
                if (type == 'digest') {
                    ctx.set(
                        'WWW-Authenticate',
                        'Digest realm="Restricted Access", algorithm="MD5", qop="auth", nonce="' +
                            Math.random().toString(36).substring(7) +
                            '"'
                    );
                } else if (type == 'bearer') {
                    ctx.set('WWW-Authenticate', 'Bearer realm="Restricted Access"');
                } else {
                    ctx.set('WWW-Authenticate', 'Basic realm="Restricted Access"');
                }
                ctx.body = 'Unauthorized';
                break;

            default:
                ctx.body = {};
                break;
        }
    },
    async resStream(ctx, next) {
        const { streamType } = ctx.params;
        const jsonType = streamType == 'json';
        const data = jsonType
            ? fs.readFileSync(path.resolve('static', 'index.json.text')).toString().split(/\n/)
            : Array.from({ length: 3 }).map((val, i) => `This is chunk ${i + 1}`);

        ctx.res.writeHead(200, { 'Content-Type': 'text/plain' });

        for (let index = 0; index < data.length; index++) {
            const chunk = data[index];
            ctx.res.write(chunk);
            index != data.length - 1 && (await utils.waitForSeconds(3e3));
        }
        // Optionally, you can end the response after writing all data
        ctx.res.end();
    },
    async resContentType(ctx, next) {
        const { contentType } = ctx.params;
        switch (contentType) {
            case 'html':
                ctx.type = 'text/html';
                ctx.body = getStaticFile('index.html');
                break;
            case 'text':
                ctx.type = 'text/plain';
                ctx.body = getStaticFile('index.txt');
                break;
            case 'img':
                ctx.type = 'image/png';
                // ctx.body = fs.readFileSync(path.resolve('static', 'index.png'));
                // ctx.body = fs.readFileSync(path.resolve('static', 'index.png')).toString('base64');
                ctx.body = getStaticFile('index.png');
                break;
            case 'video':
                ctx.type = 'video/mp4';
                ctx.body = getStaticFile('index.mp4');
                break;
            case 'css':
                ctx.type = 'text/css';
                ctx.body = getStaticFile('index.css');
                break;
            case 'xml':
                ctx.type = 'application/xml';
                ctx.body = getStaticFile('index.xml');
                break;
            case 'js':
                ctx.type = 'application/javascript';
                ctx.body = getStaticFile('index.js');
                break;
            case 'file':
                const fileName = 'index.txt';
                ctx.set('Content-Disposition', `attachment; filename="${fileName}"`);
                ctx.type = 'application/octet-stream';
                ctx.body = getStaticFile(fileName);
                break;

            case 'json':
            default:
                ctx.type = 'application/json';
                // WARNNING json must be write one-time
                // ctx.body = getStaticFile('index.json');
                ctx.body = JSON.parse(fs.readFileSync(path.resolve(rootDir, 'static/index.json')).toString());
                break;
        }
        await next();
    },
};
