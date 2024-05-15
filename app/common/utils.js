const crypto = require('crypto');
const dayjs = require('dayjs');
const path = require('path');
const fs = require('fs');
const { v4: uuidV4 } = require('uuid');
const env = require('./env');
const faker = require('chance').Chance();

module.exports = {
    faker,
    timestamp() {
        return dayjs().format('YYYY-MM-DD HH:mm:ss');
    },
    getStaticFile(fileName) {
        return fs.createReadStream(path.resolve('static', fileName));
    },
    waitForSeconds(ms = 1e3) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(1);
            }, ms);
        });
    },
    uid() {
        return uuidV4();
    },
    hmac(message) {
        const hmac = crypto.createHmac('sha256', env.SECRET_KEYS);
        hmac.update(message);
        return hmac.digest('hex');
    },
    rsa: {
        // 加密函数
        encryptRSA(text, publicKey = env.PUBLIC_KEY) {
            return crypto.publicEncrypt(publicKey, Buffer.from(text, 'utf8')).toString('base64');
        },

        // 解密函数
        decryptRSA(encrypted, privateKey = env.PRIVATE_KEY) {
            return crypto.privateDecrypt(privateKey, Buffer.from(encrypted, 'base64')).toString('utf8');
        },
    },
    aes: {
        // 加密函数
        encryptAES(text, key) {
            const iv = crypto.randomBytes(16); // 生成随机的初始化向量
            const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return {
                iv: iv.toString('hex'),
                encryptedData: encrypted,
            };
        },

        // 解密函数
        decryptAES(encryptedData, key, iv) {
            const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(iv, 'hex'));
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        },
    },
};
