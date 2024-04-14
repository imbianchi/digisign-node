const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const config = require('config');

const initRoutes = require("./routes");
const { eraseDirectory } = require('./utils/files');

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true, limit: '12240mb' }));
app.use(express.static(__dirname));
initRoutes(app);

const server = require('http').Server(app);
server.listen(config.get('app.port'),
    () => {
        console.log('Server is running on port:' + config.get('app.port'));
        eraseDirectory('./temp-files');
        eraseDirectory('./static/signed');
        eraseDirectory('./static/download');
    }
);
