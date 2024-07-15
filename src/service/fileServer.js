const { spawn } = require('child_process');
const env = require('../common/env');
const constant = require('../common/constant');

const [username, password] = env.ADMIN_WHITELIST[0].split(':');
const fileServer = spawn(
    `${constant.rootDir}/node_modules/.bin/http-server`,
    `temp -p 3001 --username ${username} --password ${password}`.split(' '),
    {
        cwd: constant.rootDir,
        detached: true,
        stdio: 'ignore',
    }
);
fileServer.unref();
