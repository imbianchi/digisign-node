const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { eraseDirectory } = require('../utils/files');

const downloadFiles = async (req, res) => {
    const directoryPath = './signed';

    // Create a new zip archive
    const zip = archiver('zip');

    // Set the response headers
    res.attachment('assinados.zip');
    zip.pipe(res);

    // Read the contents of the directory
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return res.status(500).send('Error reading directory');
        }

        // Iterate over each file in the directory
        files.forEach((file) => {
            const filePath = path.join(directoryPath, file);

            // Check if it's a file
            if (fs.statSync(filePath).isFile()) {
                // Add the file to the zip archive
                zip.file(filePath, { name: file });
            }
        });

        // Finalize the zip archive
        zip.finalize((err) => {
            if (err) {
                console.error('Error finalizing zip archive:', err);
                return res.status(500).send('Error creating zip archive');
            }

            console.log('Zip archive created and sent');
        });
    });
}

const eraseDownloadedFiles = async (req, res) => {
    await eraseDirectory('./temp-files');

    await eraseDirectory('./signed');

    res.send('OK');
}

module.exports = {
    downloadFiles,
    eraseDownloadedFiles
}