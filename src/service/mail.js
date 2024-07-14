const { getLogger } = require('../common/logger');
const CreateCompose = require('../common/useCompose');
const nodemailer = require('nodemailer');
const log = getLogger();
const mailer = nodemailer.createTransport({
    pool: true,
    host: 'smtp.163.com',
    port: 587,
    secure: true, // use TLS
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

mailer.verify((err, success) => {
    if (err) {
        log.error('mailer %s', err.toString());
    } else {
        log.info('mailer connected');
    }
});

class Service extends CreateCompose {
    constructor() {
        super();
        this.mailer = mailer;
    }
    async send(config) {
        await new Promise((resolve, reject) => {
            mailer.sendMail(
                {
                    from: process.env.MAIL_USER, // sender address
                    to: config.to || process.env.MAIL_USER_TO, // list of receivers
                    subject: config.subject || '', // Subject line
                    text: config.text || '', // plain text body
                    html: config.html || '', // html body
                    cc: config.cc || '',
                    bcc: config.bcc || '',
                    attachments: config.attachments || '',
                },
                err => {
                    if (err) {
                        log.error('mailer %s', err.toString());
                        reject(err);
                    } else {
                        resolve(1);
                    }
                }
            );
        }).catch();
    }
}

module.exports = new Service();
