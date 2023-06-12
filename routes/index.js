const express = require("express");
const router = express.Router();
const homeController = require("../controllers/home");
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
    router.get("/", homeController.getHome);

    router.get('/download', downloadController.downloadFiles)

    router.post("/upload-files", upload.any(), uploadController.multipleUpload);

    router.get("/delete-files", downloadController.eraseDownloadedFiles);

    return app.use("/", router);
};

module.exports = routes;
