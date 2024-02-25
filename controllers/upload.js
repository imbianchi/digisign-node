const fs = require('fs');
const NodeStreamZip = require('node-stream-zip');
const path = require('path');
var archiver = require('archiver');

const { eSignDocs } = require('../utils/signFile');
const globalWebSocket = require('../websocket/websocket');

const mimePFXfile = 'application/x-pkcs12';
const mimeP12file = 'application/pkcs12';
let certificate = [];
let pswd = '';
let zipFilePath = '';
let zipName = '';
let dirToZipRoot = '';


async function processFilesNames(files) {
    files.map((file) => {
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

let totalFiles = 0;
async function processZipEntries() {
    const zip = new NodeStreamZip.async({ file: zipFilePath });

    try {
        const entries = await zip.entries();
        const totalEntries = Object.entries(entries).length;

        for (const entryName in entries) {
            const entry = entries[entryName];
            const index = Object.keys(entries).indexOf(entryName);

            if (dirToZipRoot === '') {
                dirToZipRoot = entry.name.split('/')[0];
            }

            if (entry.isDirectory) {
                const dirPath = path.join('temp-files', entry.name);
                const dirSignedPath = path.join('signed', entry.name);

                await fs.promises.mkdir(dirPath, { recursive: true });
                await fs.promises.mkdir(dirSignedPath, { recursive: true });
            } else {
                const filePath = path.join('temp-files', entry.name);

                await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
                await zip.extract(entry.name, filePath);

                totalFiles++;

                globalWebSocket.sendMessage(JSON.stringify({
                    msg: 'Extraindo arquivos...',
                    fileNumber: index + 1,
                    totalFiles: totalEntries,
                    step: 1,
                    steps: 3,
                }));
            }
        }
    } catch (error) {
        console.error(`Error processing ZIP entries: ${error}`);
        throw error;
    } finally {
        await zip.close();
    }
}

async function digitalSignPDFs(dirPath) {
    return new Promise(async (resolve, reject) => {
        const files = fs.readdirSync(dirPath, { recursive: true });
        let fileNumber = 0;

        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            const dirToSigned = filePath.replace('temp-files', 'signed');

            if (stats.isDirectory()) {
                digitalSignPDFs(filePath);
            } else {
                fileNumber++;
                await eSignDocs(filePath, pswd, certificate[0].path, dirToSigned);
            }
        }

        globalWebSocket.sendMessage(JSON.stringify({
            msg: 'Assinando arquivos...',
            step: 2,
            steps: 3,
            totalFiles,
            fileNumber,
        }));

        resolve(true);
    });
}

async function zipFiles(nameZipFile) {
    const zipFilePath = path.join('static', 'download', nameZipFile);
    const output = fs.createWriteStream(zipFilePath);
    const zip = archiver('zip', {
        zlib: { level: 9 }
    });

    return new Promise((resolve, reject) => {
        output.on('close', () => {
            console.log('Zip file created successfully!');
            resolve(true);
        });

        output.on('error', function (err) {
            console.error('Error writing zip:', err);
            reject(false);
        });

        output.on('warning', function (err) {
            if (err.code === 'ENOENT') {
                console.log(err);
                reject(false);
            }
        });

        let count = 0;
        zip.on('entry', function (entry) {
            if (entry.type === 'file') {
                count++;
                
                globalWebSocket.sendMessage(JSON.stringify({
                    msg: 'Comprimindo e criando arquivo para download...',
                    step: 3,
                    steps: 3,
                    totalFiles,
                    fileNumber: count,
                }));
            }
        });

        zip.pipe(output);
        try {
            zip.directory(path.join('signed', dirToZipRoot), false);
            zip.finalize();
        } catch (error) {
            reject(error);
        }
    });
}

function startLoading(message) {
    console.log("Streaming initiated at: ", new Date());

    const loadingSymbols = ['\\', '|', '/', '-'];
    let currentSymbolIndex = 0;
    process.stdout.write(message);

    const handle = setInterval(() => {
        const symbol = loadingSymbols[currentSymbolIndex];
        process.stdout.write(`\r${message} ${symbol}`);
        currentSymbolIndex = (currentSymbolIndex + 1) % loadingSymbols.length;
    }, 100);

    return handle;
}

function stopLoading(handle, message) {
    clearInterval(handle);
    process.stdout.write(`\r${message}\n`);
    console.log("Streaming finalized at: ", new Date());
}

const processFiles = async (req, res) => {
    pswd = req.body.password;

    const handle = startLoading("Processing PDFs");

    await processFilesNames(req.files);

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

    let zipIsFinished = false;
    try {
        zipIsFinished = await zipFiles(zipName);
    } catch (error) {
        console.error('Error zipping signed files:', error);

        return res.status(500).json({
            message: error.message
        });
    }

    if (zipIsFinished) {
        stopLoading(handle, "### PDFs processed. ###\n\n");

        return res.status(200).json({
            message: 'Files signed with success!',
            data: {
                zipName
            }
        });
    }
}

module.exports = {
    processFiles
}
