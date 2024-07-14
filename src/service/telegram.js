const TelegramBot = require('node-telegram-bot-api');
const CreateCompose = require('../common/useCompose');
const { getLogger } = require('../common/logger');
const utils = require('../common/utils');
const log = getLogger();

const token = process.env.TG_TOKEN;
const bot = new TelegramBot(token, { polling: true });

class Service extends CreateCompose {
    constructor() {
        super();
        this.token = token;
        this.groupId = process.env.TG_GROUP_ID;
        this.bot = bot;
        this.init();
        bot.on('message', msg => {
            // {"message_id":2,"from":{"id":2020807895,"is_bot":false,"first_name":"Rosendo","username":"rosendoX","language_code":"en"},"chat":{"id":-1002231802147,"title":"Binance Test","type":"supergroup"},"date":1720944214,"text":"xxx","has_protected_content":true}
            this.trigger('tg/message', msg);
        });
    }
    init() {
        this.send(`startedAt:${utils.timestamp()}`);
    }
    send(str) {
        // ,`<b>title:${(this.globalMap.minDiff * 100).toFixed(2)}%</b>`
        // <pre></pre>
        return bot.sendMessage(this.groupId, str, { parse_mode: 'HTML' }).catch();
    }
}

module.exports = new Service();
