const fs = require('fs');
const path = require('path');
const { getStaticFile } = require('../common/utils');
const logger = require('../common/logger');
const utils = require('../common/utils');

module.exports = router => {
    router
        .get('/res/json', ctx => {
            ctx.type = 'application/json';
            ctx.body = getStaticFile('index.json');
        })
        .get('/res/html', ctx => {
            ctx.type = 'text/html';
            ctx.body = getStaticFile('index.html');
        })
        .get('/res/text', ctx => {
            ctx.type = 'text/plain';
            ctx.body = getStaticFile('index.txt');
        })
        .get('/res/img', ctx => {
            ctx.type = 'image/png';
            // ctx.body = fs.readFileSync(path.resolve('static', 'index.png'));
            // ctx.body = fs.readFileSync(path.resolve('static', 'index.png')).toString('base64');
            ctx.body = getStaticFile('index.png');
        })
        .get('/res/video', ctx => {
            ctx.type = 'video/mp4';
            ctx.body = getStaticFile('index.mp4');
        })
        .get('/res/css', ctx => {
            ctx.type = 'text/css';
            ctx.body = getStaticFile('index.css');
        })
        .get('/res/xml', ctx => {
            ctx.type = 'application/xml';
            ctx.body = getStaticFile('index.xml');
        })
        .get('/res/js', ctx => {
            ctx.type = 'application/javascript';
            ctx.body = getStaticFile('index.js');
        })
        .get('/res/stream/:streamType', async ctx => {
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
        })
        .get('/res/file', ctx => {
            const fileName = 'index.txt';
            ctx.set('Content-Disposition', `attachment; filename="${fileName}"`);
            ctx.type = 'application/octet-stream';
            ctx.body = getStaticFile(fileName);
        });
};
