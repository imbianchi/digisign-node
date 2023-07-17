const fs = require('fs');
const { eSignDocs } = require('../utils/signFile');
const { zipFiles } = require('./download');

const mimePFXfile = 'application/x-pkcs12';
const mimeP12file = 'application/pkcs12';
const mimePDFFile = 'application/pdf';

const signAndZipFiles = async (req, res) => {
    const certificate = [];
    const pdfs = [];
    const pswd = req.body.password;

    try {
        req.files.map(file => {
            if (file.mimetype === mimePDFFile) {
                pdfs.push(file)
            }

            if (file.mimetype === mimeP12file || file.mimetype === mimePFXfile) {
                certificate.push(file)
            }
        })
    } catch (error) {
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error,
        })
    }

    if (certificate.length == 0) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'No certificate was provided.'
        })
    }

    if (!pswd) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'No password was provided.'
        })
    }

    if (pdfs.length == 0) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'No PDFs was provided.'
        })
    }

    const certificateBuffer = fs.readFileSync(certificate[0].path);

    const err = {};
    try {
        for (const pdf of pdfs) {
            await eSignDocs(pdf, pswd, certificateBuffer);
        }
    } catch (error) {
        err.status = 400;
        err.message = error.message;
    }

    if (err.status) {
        return res.status(400).json({
            message: err.message,
        });
    }

    return res.json(await zipFiles(req, res));
}

module.exports = {
    signAndZipFiles
}
