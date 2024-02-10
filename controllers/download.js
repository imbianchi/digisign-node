const fs = require('fs');
const path = require('path');
const { eraseDirectory } = require('../utils/files');
var archiver = require('archiver');


const zipFiles = async (nameRootFileZip, nameZipFile) => {
    const zipFilePath = path.join('static', 'download', `${nameZipFile}-signed.zip`);
    let output;

    new Promise((resolve, reject) => {

        try {
            output = fs.createWriteStream(zipFilePath);
        } catch (error) {
            console.log('Error creating zip file:', error);
            reject(error);
        }

        const zip = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        function addDirectory(dir) {
            const files = fs.readdirSync(dir);

            for (const file of files) {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);

                if (stats.isDirectory()) {
                    zip.directory(filePath, file); // Add directory entry
                    addDirectory(filePath); // Recursively call for nested directories
                } else {
                    zip.file(filePath, { name: file }); // Add file entry
                }
            }
        }

        addDirectory(nameRootFileZip);

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

const eraseDownloadedFiles = async (req, res) => {
    await eraseDirectory('./temp-files');

    await eraseDirectory('./signed');

    await eraseDirectory('./static/download');
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
    }

}

module.exports = {
    zipFiles,
    eraseDownloadedFiles,
    downloadSignedFiles
}