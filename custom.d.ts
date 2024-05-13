declare namespace NodeJS {
    interface ProcessEnv {
        SESSION_KEYS: string;
        PORT: number;
        ADMIN_WHITELIST: string;
    }
}
