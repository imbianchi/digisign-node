const express = require("express");
const router = express.Router();
const path = require('path');
const uploadController = require("../controllers/upload");
const downloadController = require("../controllers/download");
const multer = require('multer');
const config = require('config');

const storage = multer.diskStorage({
    limits: { fileSize: 1024 * 1024 * 1024 * 10 },
    destination: 'temp-files/',
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    },
})
const upload = multer({ storage });

let routes = app => {
    router.get("/", (req, res) => res.sendFile(path.join(`${__dirname}/../views/index.html`)));

    router.get('/download', downloadController.downloadSignedFiles)

    router.post("/process-files", upload.any(), uploadController.processFiles);

    router.delete("/delete-files", downloadController.eraseDownloadedFiles);

    router.get('/ws', (req, res) => res.send({
        wsPort: config.get('websocket.port'),
        wsHost: config.get('websocket.host')
    }))

    return app.use("/", router);
};

module.exports = routes;
