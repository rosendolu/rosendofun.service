const assert = require('assert');
const { ensureDir, move } = require('fs-extra');
const path = require('node:path');
const util = require('node:util');
const { rootDir } = require('../common/constant');
const { glob } = require('glob');
module.exports = {
    async uploadFile(ctx, next) {
        const { uid, nickname } = ctx.session;
        let fileArr = [];
        // multiple files
        const files = ctx.request.files.file;
        assert(files, 'Empty file');
        for (let i = 0; i < (files.length || 1); i++) {
            const { filepath, mimetype, newFilename, originalFilename, size } = files[i] || files;
            const userFilePath = path.join(rootDir, 'temp/upload/', uid, newFilename);
            await ensureDir(path.dirname(userFilePath));
            await move(filepath, userFilePath, { overwrite: true });
            ctx.body = {
                path: userFilePath,
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
