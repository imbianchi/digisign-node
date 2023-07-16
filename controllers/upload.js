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

    const pdfsIsSigned = new Promise(async (resolve, reject) => {
        try {
            for (const pdf of pdfs) {
                await eSignDocs(pdf, pswd, certificateBuffer);
            }

            resolve(1);
        } catch (error) {
            reject(error);
        }
    }).then(result => result)
        .catch(err => {
            return {
                error: err,
                message: err.message,
                status: 400,
            }
        });

    const result = await pdfsIsSigned;

    if (result.status == 400) {
        res.status(result.status).json(await pdfsIsSigned);
    } else {
        res.json(await zipFiles(req, res));
    }

}

module.exports = {
    signAndZipFiles
}
