const fs = require('fs');
const NodeStreamZip = require('node-stream-zip');
const path = require('path');
var archiver = require('archiver');
const { eSignDocs } = require('../utils/signFile');

const mimePFXfile = 'application/x-pkcs12';
const mimeP12file = 'application/pkcs12';
let certificate = [];
let pswd = '';
let zipFilePath = '';
let zipName = '';
let dirToZipRoot = '';

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

async function processZipEntries() {
    const zip = new NodeStreamZip.async({ file: zipFilePath });

    try {
        const entries = await zip.entries();

        for (const entryName in entries) {
            const entry = entries[entryName];

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
            }
        }
    } catch (error) {
        console.error(`Error processing ZIP entries: ${error}`);
        throw error;
    } finally {
        await zip.close();
    }
}

async function processFilesNames(files) {
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
    return new Promise(async (resolve, reject) => {
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

        resolve(true);
    });
}

async function zipFiles(nameZipFile, dirToZip) {
    const zipFilePath = path.join('static', 'download', nameZipFile);
    let output;

    new Promise((resolve, reject) => {
        try {
            output = fs.createWriteStream(zipFilePath);
        } catch (error) {
            reject(error);
        }

        const zip = archiver('zip', {
            zlib: { level: 9 }
        });

        function addDirectory(dir) {

            console.log('Adding directory:', dir);
            const files = fs.readdirSync(dir, { recursive: true });

            for (const file of files) {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);

                if (stats.isDirectory()) {
                    zip.directory(file);
                    addDirectory(filePath);
                } else {
                    if (dir === dirToZip) {
                        zip.file(filePath, { name: file });
                    }
                }
            }
        }

        addDirectory(dirToZip);

        zip.pipe(output);
        zip.finalize();

        output.on('close', () => {
            console.log('Zip file created successfully!');
        });

        output.on('end', function () {
            console.log('Data has been drained');
        });

        output.on('error', function (err) {
            console.error('Error writing zip:', err);
        });

        output.on('warning', function (err) {
            if (err.code === 'ENOENT') {
                console.log(err);
            }
        });

        resolve();
    });
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

    try {
        await zipFiles(zipName, 'signed/' + dirToZipRoot);
    } catch (error) {
        console.error('Error zipping signed files:', error);

        return res.status(500).json({
            message: error.message
        });
    }

    stopLoading(handle, "### PDFs processed. ###\n\n");

    setTimeout(() => {
        return res.status(200).json({
            message: 'Files signed with success!',
            data: {
                zipName
            }
        });
    }, 2000);
}

module.exports = {
    processFiles
}
