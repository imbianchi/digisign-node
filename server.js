const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const initRoutes = require("./routes");
const { eraseDirectory } = require('./utils/files');

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true, limit: '10240mb' }));
app.use(express.static(__dirname));
initRoutes(app);

const server = require('http').Server(app);
server.listen(3001,
    () => {
        console.log('Server is running on port: 3001');
        eraseDirectory('./temp-files');
        eraseDirectory('./signed');
        eraseDirectory('./static/download');
    }
);
