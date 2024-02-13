const fs = require('fs');
const path = require('path');


async function eraseDirectory(folderPath) {
    try {
        const files = fs.readdirSync(folderPath);

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            fs.rmSync(filePath, { recursive: true, force: true });
        }
    } catch (error) {
        console.error(`Error erasing folder contents: ${error.message}`);
        throw error;
    }
}

module.exports = {
    eraseDirectory
}