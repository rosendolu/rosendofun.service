const { CronJob } = require('cron');

new CronJob(
    '15 * * * * *', // cronTime
    async function () {
        //
    }, // onTick
    null, // onComplete
    true // start
);
