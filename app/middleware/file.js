const assert = require('assert');
const { ensureDir, move } = require('fs-extra');
const path = require('node:path');
const util = require('node:util');
const { rootDir } = require('../common/constant');
const { glob } = require('glob');
const { spawn, exec } = require('child_process');
const logger = require('../common/logger');
module.exports = {
    async uploadFile(ctx, next) {
        const { uid, nickname } = ctx.session;
        let fileArr = [];
        // multiple files
        const files = ctx.request.files.file;
        assert(files, 'Empty file');
        for (let i = 0; i < (files.length || 1); i++) {
            const { filepath, mimetype, newFilename, originalFilename, size } = files[i] || files;
            const newVideoPath = path.join(uid, newFilename);

            const userFilePath = path.join(rootDir, 'temp/upload/', newVideoPath);
            const userFilePathDir = path.dirname(userFilePath);
            await ensureDir(userFilePathDir);
            await move(filepath, userFilePath, { overwrite: true });

            if (/(?:\.mp4|\.mov)$/.test(userFilePath)) {
                const sourcePath = path.join(userFilePathDir, path.parse(newFilename).name, 'output.m3u8');
                await ensureDir(path.dirname(sourcePath));
                const command = `ffmpeg -v error -i ${userFilePath} \
                -map 0:v -crf 23 -preset medium \
                -map 0:a? -c:a aac -b:a 128k \
                -hls_time 10 -hls_list_size 6 -f hls ${sourcePath}`;

                const { stdout, stderr } = await util.promisify(exec)(command);
                stderr && logger.error('ffmpeg hls %s', stderr);
            }

            ctx.body = {
                playUrl: path.join(uid, 'output.m3u8'),
                path: newVideoPath,
                mimetype,
                size,
            };
        }
        await next();
    },
    async listFile(ctx, next) {
        let { uid, nickname } = ctx.session;
        const userFilePath = path.join(rootDir, 'temp/upload/', uid);
        const list = await glob('./**', { cwd: userFilePath, dot: false, maxDepth: 1 });
        ctx.body = list;
    },
};
