const fs = require('fs');
const { eSignDocs } = require('../utils/signFile');
const { zipFiles, downloadSignedFiles } = require('./download');
const AdmZip = require('adm-zip');
const path = require('path');
const { eraseDirectory } = require('../utils/files');

const mimePFXfile = 'application/x-pkcs12';
const mimeP12file = 'application/pkcs12';
const mimePDFFile = 'application/pdf';

export default class ProcessFiles {
    constructor(req, res) {
        this.req = req;
        this.res = res;
        this.certificate = [];
        this.pdfs = [];
        this.pswd = req.body.password;
        this.tempFilesDir = path.join('temp-files', '/');
        this.nameRootFileZip = "";
    }
}

const processFiles = async (req, res) => {
    const certificate = [];
    const pdfs = [];
    const pswd = req.body.password;

    // VALIADATE IF THE FILES ARE IN THE CORRECT FORMAT
    

    // UNZIP ALL FILES IN A ORDERED WAY TO THE TEMP-FILES FOLDER

    // DIGITAL SIGN ALL FILES FROM TEM-FILE DIR AND CREATE A NEW DIR CALLED SIGNED

    // ZIP ALL FILES FROM SIGNED DIR

    // CREATE A ZIP FILE WITH ALL SIGNED FILES AND SAVE IT IN THE DOWNLOAD DIR

    // DELETE ALL FILES FROM TEMP-FILES

    // DELETE ALL FILES FROM SIGNED


    let nameRootFileZip = path.join('temp-files', '/');
    let nameZipFile;

    try {
        req.files.map(file => {
            if (file.mimetype === 'application/x-zip-compressed' || file.mimetype === 'application/zip') {

                const zip = new AdmZip(file.path);
                const entries = zip.getEntries();
                nameZipFile = file.originalname.replace('.zip', '');

                new Promise((resolve, reject) => {
                    entries.forEach(entry => {

                        if (nameRootFileZip === path.join('temp-files', '/')) {
                            nameRootFileZip += entry.entryName.split('/')[0];
                        }

                        if (entry.isDirectory) {
                            const dirPath = path.join('temp-files', entry.entryName);
                            fs.mkdirSync(dirPath, { recursive: true });
                        } else {
                            const filePath = path.join('temp-files', entry.entryName);
                            const data = entry.getData();

                            fs.writeFileSync(filePath, data);
                            pdfs.push(fs.writeFileSync(filePath, data));
                        }
                    });

                    resolve();
                });
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
        await processFiles(nameRootFileZip, pswd, certificateBuffer, nameZipFile);
    } catch (error) {
        console.error(`Error reading directory: ${nameRootFileZip}`, error);
        err.status = 400;
        err.message = error.message;
    }

    try {
        await zipFiles(nameRootFileZip, nameZipFile);
    } catch (error) {
        err.message = error.message;
        err.status = 500;
    }

    if (err.status) {
        return res.status(err.status).json({
            message: err.message,
        });
    }

    setTimeout(() => {
        return res.status(200).json({
            message: 'Files signed with success!',
            data: {
                zipName: `${nameZipFile}-signed.zip`
            }
        });
    }, 2000);
}

async function processFiles(dirPath, pswd, certificateBuffer, nameZipFile) {
    const files = fs.readdirSync(dirPath);

    new Promise(async (resolve, reject) => {
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                console.log('Directory:', filePath);
                fs.mkdirSync(path.join('signed', nameZipFile), { recursive: true });
                await processFiles(filePath);
            } else {
                await eSignDocs(filePath, pswd, certificateBuffer);
            }
        }
        resolve();
    });
}

module.exports = {
    signAndZipFiles
}
