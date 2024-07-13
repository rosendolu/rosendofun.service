const crypto = require('crypto');
const dayjs = require('dayjs');
const path = require('path');
const fs = require('fs');
const { v4: uuidV4 } = require('uuid');
const env = require('./env');
const { text } = require('stream/consumers');
const { log } = require('console');
const faker = require('chance').Chance();

function timestamp() {
    return dayjs().format('YYYY-MM-DD HH:mm:ss');
}
function getStaticFile(fileName) {
    return fs.createReadStream(path.resolve('static', fileName));
}
function waitForSeconds(ms = 1e3) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(1);
        }, ms);
    });
}
async function delay(ms) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(1);
        }, timeFn(ms));
    });
}
function betweenMinMax(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function createConcurrent(concurrency, msFn) {
    let pendingCount = 0;
    const queue = [];
    async function concurrentWrapper(callback) {
        if (pendingCount >= concurrency) {
            await new Promise(resolve => queue.push(resolve));
        }
        pendingCount++;
        try {
            await Promise.resolve(callback());
            await delay(msFn);
        } finally {
            pendingCount--;
            if (queue.length > 0) {
                const resolve = queue.shift();
                resolve();
            }
        }
    }
    return concurrentWrapper;
}
async function waitFor(fn, msFn, maxCount = -1) {
    let pollCount = 0;
    async function callback(resolve, reject) {
        try {
            const res = await Promise.resolve(fn());
            if (res) {
                return resolve(res);
            }
        } catch (err) {
            log('fn poll err', fn?.name, err);
        }
        pollCount++;
        if (maxCount != -1 && pollCount > maxCount) {
            return reject(`maxCount limit, maxCount`);
        }
        await delay(msFn);
        callback(resolve, reject);
    }
    return new Promise((resolve, reject) => callback(resolve, reject));
}
function uid() {
    return uuidV4();
}
function hmac(message) {
    const hmac = crypto.createHmac('sha256', env.SECRET_KEYS);
    hmac.update(message);
    return hmac.digest('hex');
}

// 加密函数
function encryptRSA(text, publicKey = env.PUBLIC_KEY) {
    return crypto.publicEncrypt(publicKey, Buffer.from(text, 'utf8')).toString('base64');
}

// 解密函数
function decryptRSA(encrypted, privateKey = env.PRIVATE_KEY) {
    return crypto.privateDecrypt(privateKey, Buffer.from(encrypted, 'base64')).toString('utf8');
}

// 加密函数
function encryptAES(text, key) {
    const iv = crypto.randomBytes(16); // 生成随机的初始化向量
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
    };
}

// 解密函数
function decryptAES(encryptedData, key, iv) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function displayDuration(date) {
    let diff = dayjs().diff(date);
    const duration = dayjs.duration(diff);
    const days = duration.days();
    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    return `${days ? days + 'd' : ''}${hours ? hours + 'h' : ''}${minutes ? minutes + 'm' : ''}${
        seconds ? seconds + 's' : ''
    }`;
}

function timeFn(ms) {
    if (typeof ms === 'function') {
        return ms();
    }
    return ms;
}

function throttledCallback(ms) {
    let pending = false;
    return async callback => {
        try {
            if (pending) return;
            pending = true;
            await Promise.resolve(callback());
        } catch (error) {}
        await delay(ms);
        pending = false;
    };
}

module.exports = {
    timeFn,
    throttledCallback,
    displayDuration,
    faker,
    betweenMinMax,
    timestamp,
    getStaticFile,
    waitForSeconds,
    delay,
    createConcurrent,
    waitFor,
    uid,
    hmac,
    rsa: {
        encryptRSA,
        decryptRSA,
    },
    aes: {
        encryptAES,
        decryptAES,
    },
};
