const { getLogger } = require('../common/logger');
const CreateCompose = require('../common/useCompose');
const utils = require('../common/utils');
const log = getLogger();
class Service extends CreateCompose {
    constructor() {
        super();
        this.BASEURL = process.env.BASEURL_FEISHU;
    }
    send(content) {
        const params = {
            msg_type: 'post',
            content: {
                post: {
                    zh_cn: content,
                },
            },
        };
        return fetch(this.BASEURL, { method: 'POST', body: JSON.stringify(params) });
    }
}

module.exports = new Service();
