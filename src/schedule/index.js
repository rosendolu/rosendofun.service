const { glob } = require('glob');
const { logger } = require('../common/logger');
const path = require('path');
const { isProdEnv } = require('../common/constant');

const jobs = glob.sync('./**/*.schedule.js', { cwd: __dirname });

if (!isProdEnv) {
    logger.info('schedule %s', jobs);
}
try {
    for (const jobPath of jobs) {
        require(path.resolve(__dirname, jobPath));
    }
} catch (err) {
    logger.error('schedule/index.js %s', err.toString());
}
