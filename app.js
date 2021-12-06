const express = require('express');
const app = express();
const cors = require('cors')
const mongoose = require('mongoose');
require('dotenv').config();

//Puerto
const port = process.env.PORT || 3000;

//Importing Api router
const ApiRouter = require('./src/routes/Api.routes');

//Swagger
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const swaggerOptions = {
    swaggerDefinition: {
        swagger: "2.0",
        info: {
            title: "Adogtame API",
            description: "Documentation for Adogtame API",
            version: "1.0.0",
            servers: ['http://localhost:' + port],
            contact: {
                name: "ITESO",
                correo: "main@iteso.mx"
            }
        }
    },
    apis: ['./src/routes/*']
}
const swaggerDocs = swaggerJsDoc(swaggerOptions);

ApiRouter.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

const DB_URI = "mongodb+srv://" + process.env.DB_USER + ":" + process.env.DB_PASSWORD + "@" + process.env.DB_CLUSTER + ".hwczx.mongodb.net/" + process.env.DB_COLLECTION + "?retryWrites=true&w=majority";
mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => {
        console.log("connected to db...")

        app.use(cors());
        app.use(express.urlencoded({ extended: true }));
        app.use(express.json());

        app.use('/api', ApiRouter);

        app.listen(port, () => {
            console.log('App API is listening in port: ' + port);
            console.log('http://localhost:' + port + '/api/');
            console.log('Swagger Docs: ' + 'http://localhost:' + port + '/api/docs');
        });
    })
    .catch((err) => console.log(err));