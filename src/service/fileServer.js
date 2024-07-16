const { spawn } = require('child_process');
const env = require('../common/env');
const constant = require('../common/constant');
const { getLogger } = require('../common/logger');
const log = getLogger();

const port = 3001;
const [username, password] = env.ADMIN_WHITELIST[0].split(':');
const fileServer = spawn(
    `${constant.rootDir}/node_modules/.bin/http-server`,
    `temp -p ${port} --username ${username} --password ${password}`.split(' '),
    {
        cwd: constant.rootDir,
    }
);
fileServer.on('spawn', () => {
    log.info('File server running at: http://127.0.0.1:%s', port);
});
fileServer.on('error', err => {
    log.error('file server err %s', err);
});

process.on('beforeExit', () => {
    fileServer.kill();
});
