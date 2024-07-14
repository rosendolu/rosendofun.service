declare namespace NodeJS {
    interface ProcessEnv {
        SECRET_KEYS: string;
        PORT: number;
        ADMIN_WHITELIST: string;
        BINANCE_APIKEY: string;
        BINANCE_APISECRET: string;
        TG_TOKEN: string;
        TG_GROUP_ID: string;
        BASEURL_FEISHU: string;
        MAIL_USER: string;
        MAIL_PASS: string;
        MAIL_USER_TO: string;
    }
}
