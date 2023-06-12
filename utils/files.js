const fs = require('fs');
const path = require('path');


async function eraseDirectory(directoryPath) {
    // Read the contents of the directory
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        // Iterate over each file in the directory
        files.forEach((file) => {
            const filePath = path.join(directoryPath, file);

            // Check if it's a file
            if (fs.statSync(filePath).isFile()) {
                // Delete the file
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                    }
                });
            }
        });
    });
}

module.exports = {
    eraseDirectory
}