require('dotenv').config();

module.exports = {
    app: {
        port: process.env.PORT || 3001,
        host: process.env.HOST || 'localhost',
    },
    websocket: {
        port: process.env.WS_PORT || 4080,
        host: process.env.WS_HOST || 'localhost',
    },
    storage: {
        temp: './temp-files',
        signed: './static/signed',
        download: './static/download',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    },
    mail: {
        host: process.env.MAIL_HOST || 'smtp.ethereal.email',
        port: process.env.MAIL_PORT || 587,
        user: process.env.MAIL_USER || 'user',
        pass: process.env.MAIL_PASS || 'pass',
    },
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 27017,
        name: process.env.DB_NAME || 'test',
        user: process.env.DB_USER || 'user',
        pass: process.env.DB_PASS || 'pass',
    },
};