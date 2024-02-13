const fs = require('fs');
const path = require('path');
const { eraseDirectory } = require('../utils/files');


const eraseDownloadedFiles = async (req, res) => {
    await eraseDirectory('./temp-files');

    await eraseDirectory('./signed');

    await eraseDirectory('./static/download');

    res.status(200).send('Files deleted');
}

const downloadSignedFiles = async (req, res) => {
    const filePath = path.join('static', 'download');

    const zipFounded = new Promise((resolve, reject) => {
        fs.readdir(filePath, (err, files) => {
            if (err) {
                console.error('Error reading directory:', err);
                return reject(err)
            }

            files.forEach((file) => {
                if (fs.statSync(path.join(filePath, file)).isFile() && file.includes(req.query.zipToDownload)) {
                    resolve(file);
                }
            });
        });
    })

    if (await zipFounded) {
        res.download(filePath + '/' + await zipFounded, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).send('Error downloading file');
            }
        });
    } else {
        res.status(404).send('File not found');
    }

}

module.exports = {
    eraseDownloadedFiles,
    downloadSignedFiles
}