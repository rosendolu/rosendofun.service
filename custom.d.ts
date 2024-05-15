declare namespace NodeJS {
    interface ProcessEnv {
        SECRET_KEYS: string;
        PORT: number;
        ADMIN_WHITELIST: string;
    }
}
