const fs = require('fs');
const path = require('path');
const { eraseDirectory } = require('../utils/files');
var archiver = require('archiver');


const handleZipSignedFiles = async () => {
    const filesZip = new Promise((resolve, reject) => {
        fs.readdir('./signed', (err, files) => {
            if (err) {
                console.error('Error reading directory:', err);
                return reject(err)
            }

            const filesToZip = []
            files.forEach((file) => {
                const filePath = path.join('./signed', file);

                if (fs.statSync(filePath).isFile() && file.includes('pdf')) {
                    filesToZip.push({ path: filePath, file });
                }
            });

            resolve(filesToZip);
        });
    });

    return await filesZip;
}

const zipFiles = async () => {
    const directoryPath = path.join('static', 'download');
    const zipName = new Date().getTime() + '-signed.zip';
    const zipFilePath = directoryPath + '/' + zipName

    const output = fs.createWriteStream(zipFilePath);
    const zip = archiver('zip', {
        zlib: { level: 9 }
    });

    const filesToZip = await handleZipSignedFiles();

    filesToZip.forEach(file => {
        zip.file(file.path, { name: file.file });
    });

    const isOutputClosed = new Promise((resolve, reject) => {
        zip.pipe(output);

        zip.finalize();

        output.on('close', function () {
            resolve({
                message: "Files signed with success!",
                status: 200,
                data: { zipName }
            })
        });

        output.on('warning', function (err) {
            if (err.code === 'ENOENT') {
                console.log(err);
            }

            reject();
        });

    });

    const outputData = await isOutputClosed;

    return outputData ? outputData : {
        error: outputData,
        status: 500,
        message: 'Something went wrong. Try again later.'
    }
}

const eraseDownloadedFiles = async (req, res) => {
    await eraseDirectory('./temp-files');

    await eraseDirectory('./signed');

    await eraseDirectory('./static/download');
}

const downloadSignedFiles = async (req, res) => {
    const { zipToDownload } = req.query
    const filePath = path.join('static', 'download', '/');
    const zipFilePath = filePath + zipToDownload;

    const zipFounded = new Promise((resolve, reject) => {
        fs.readdir(filePath, (err, files) => {
            if (err) {
                console.error('Error reading directory:', err);
                return reject(err)
            }

            files.forEach((file) => {
                if (fs.statSync(path.join(filePath, file)).isFile() && file.includes(zipToDownload)) {
                    resolve(file);
                }
            });
        });
    })

    if (await zipFounded) {
        res.download(zipFilePath, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).send('Error downloading file');
            }

            setTimeout(() => {
                eraseDownloadedFiles();
            }, 2000)
        });
    }

}

module.exports = {
    zipFiles,
    eraseDownloadedFiles,
    downloadSignedFiles
}