const TelegramBot = require('node-telegram-bot-api');
const CreateCompose = require('../common/useCompose');
const { getLogger } = require('../common/logger');
const utils = require('../common/utils');
const log = getLogger();

const bot = new TelegramBot(this.token, { polling: true, webHook: true });
class Service extends CreateCompose {
    constructor() {
        super();
        this.token = process.env.TG_TOKEN;
        this.groupId = process.env.TG_GROUP_ID;
        this.bot = bot;
        this.init();
    }
    init() {
        this.send(`startedAt:${utils.timestamp()}`);
    }
    send(str) {
        // ,`<b>title:${(this.globalMap.minDiff * 100).toFixed(2)}%</b>`
        // <pre></pre>
        bot.sendMessage(this.groupId, str, { parse_mode: 'HTML' });
    }
}

module.exports = new Service();
