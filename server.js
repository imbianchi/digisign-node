const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const initRoutes = require("./routes");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
initRoutes(app);


app.listen(process.env.PORT,
    () => console.log('Server is running on port: ' + process.env.PORT || '4000')
);
