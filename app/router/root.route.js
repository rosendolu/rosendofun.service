const dayjs = require('dayjs');
const utils = require('../common/utils');
module.exports = router => {
    router.all('/', ctx => {
        const { nickname, visitCount, uid, lastVisit } = ctx.session;
        ctx.body = {
            message: `Last visit ${dayjs().to(dayjs(lastVisit))}!`,
            visitCount: visitCount,
            lastVisit: lastVisit,
            nickname,
            uid,
            serverTime: utils.timestamp(),
        };
    });
};
