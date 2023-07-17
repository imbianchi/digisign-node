const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const initRoutes = require("./routes");

// EXPRESS - ROUTES - DIR - CONFIGURATIONS
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
initRoutes(app);

// END OF CONFIGS - SERVER
const server = require('http').Server(app);
server.listen(4000,
    () => console.log('Server is running on port: 4000')
);
