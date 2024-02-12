const fs = require('fs');
const AdmZip = require('adm-zip');
const path = require('path');
const { dir } = require('console');
const { eSignDocs } = require('../utils/signFile');

const mimePFXfile = 'application/x-pkcs12';
const mimeP12file = 'application/pkcs12';
let certificate = [];
let pswd = '';
let zipFilePath = '';
let zipName = '';
let dirToZipRoot = '';

async function processZipEntries() {
    const zip = new AdmZip(zipFilePath);
    const entries = zip.getEntries();

    new Promise((resolve, reject) => {
        entries.forEach(entry => {
            if (dirToZipRoot === '') {
                dirToZipRoot = entry.entryName.split('/')[0];
            }

            if (entry.isDirectory) {
                const dirPath = path.join('temp-files', entry.entryName);
                const dirSignedPath = path.join('signed', entry.entryName);

                fs.mkdirSync(dirPath, { recursive: true });
                fs.mkdirSync(dirSignedPath, { recursive: true });
            } else {
                const filePath = path.join('temp-files', entry.entryName);
                const data = entry.getData();

                fs.writeFileSync(filePath, data);
            }
        });

        resolve();
    });
}

async function process(files) {
    files.map(file => {
        if (file.mimetype === 'application/x-zip-compressed' || file.mimetype === 'application/zip') {
            zipFilePath = file.path;
            zipName = file.originalname;
        }

        if (file.mimetype === mimeP12file || file.mimetype === mimePFXfile) {
            certificate.push(file)
        }
    });
}

async function validateFiles() {
    if (zipFilePath == "") throw new Error('No Zip File was provided.');
    if (certificate.length == 0) throw new Error('No certificate was provided.');
    if (!pswd) throw new Error('No password was provided.');
}

async function digitalSignPDFs(dirPath) {
    new Promise(async (resolve, reject) => {
        const files = fs.readdirSync(dirPath, { recursive: true });

        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                await digitalSignPDFs(filePath);
            } else {
                await eSignDocs(file, pswd, certificate[0].path, dirToZipRoot);
            }
        }

        resolve();
    });
}

const processFiles = async (req, res) => {
    pswd = req.body.password;

    await process(req.files);

    try {
        await validateFiles();
    } catch (error) {
        console.error('Error validating files:', error);

        return res.status(400).json({
            message: error.message
        });
    }

    try {
        await processZipEntries();
    } catch (error) {
        console.error('Error processing zip entries:', error);

        return res.status(500).json({
            message: error.message
        });
    }

    try {
        await digitalSignPDFs('temp-files/' + dirToZipRoot);
    } catch (error) {
        console.error('Error signing files:', error);

        return res.status(500).json({
            message: error.message
        });
    }

    // ZIP ALL FILES FROM SIGNED DIR

    // CREATE A ZIP FILE WITH ALL SIGNED FILES AND SAVE IT IN THE DOWNLOAD DIR

    // DELETE ALL FILES FROM TEMP-FILES

    // DELETE ALL FILES FROM SIGNED

    // const err = {};

    // try {
    //     await processFiles(nameRootFileZip, pswd, certificateBuffer, nameZipFile);
    // } catch (error) {
    //     console.error(`Error reading directory: ${nameRootFileZip}`, error);
    //     err.status = 400;
    //     err.message = error.message;
    // }

    // try {
    //     await zipFiles(nameRootFileZip, nameZipFile);
    // } catch (error) {
    //     err.message = error.message;
    //     err.status = 500;
    // }

    // if (err.status) {
    //     return res.status(err.status).json({
    //         message: err.message,
    //     });
    // }

    // setTimeout(() => {
    //     return res.status(200).json({
    //         message: 'Files signed with success!',
    //         data: {
    //             zipName: `${nameZipFile}-signed.zip`
    //         }
    //     });
    // }, 2000);
}

module.exports = {
    processFiles
}
