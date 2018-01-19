"use strict";
const express = require('express');
const bodyParser = require('body-parser');
const logger = require("morgan");
const mongoose = require("mongoose");
const flashRoutes = require("./lib/controller/flash").router;
const authMiddleware = require("./lib/utils").authMiddleware;
const SourceMapSupport = require("source-map-support");

// authentication settings
const AUTH_USERNAME = process.env.AUTH_USERNAME;
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;

let app = express();

// configure app
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

if (AUTH_USERNAME != null && AUTH_PASSWORD != null) {
    console.log(`Enabling HTTP basic auth with user ${AUTH_USERNAME}`);
    app.use(authMiddleware(AUTH_USERNAME, AUTH_PASSWORD));
}

// connect to database
const MONGODB_URL = process.env.MONGODB_URL || 'localhost';
mongoose.Promise = global.Promise;
// noinspection JSUnresolvedFunction
mongoose.connect(`mongodb://${MONGODB_URL}/flash-channel`, {});
// noinspection JSUnresolvedVariable
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// add Source Map Support
SourceMapSupport.install();

// add Flash controller
app.use('/flash', flashRoutes);

// error handler
app.use(function (err, req, res) {
    console.log(err);
    res.status(400).json(err);
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log(`Flash server listening on port ${port}`);
});
