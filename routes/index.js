const express = require("express");
const router = express.Router();
const path = require('path');
const uploadController = require("../controllers/upload");
const downloadController = require("../controllers/download");
const multer = require('multer');

const storage = multer.diskStorage({
    destination: 'temp-files/',
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})
const upload = multer({ storage });

let routes = app => {
    router.get("/", (req, res) => res.sendFile(path.join(`${__dirname}/../views/index.html`)));

    router.get('/download', downloadController.downloadSignedFiles)

    router.post("/sign-and-zip-files", upload.any(), uploadController.processFiles);

    router.get("/delete-files", downloadController.eraseDownloadedFiles);

    return app.use("/", router);
};

module.exports = routes;
