"use strict";
const express = require('express');
const bodyParser = require('body-parser');
const logger = require("morgan");
const mongoose = require("mongoose");
const flashRoutes = require("./lib/controller/flash").router;
const authMiddleware = require("./lib/utils").authMiddleware;
const SourceMapSupport = require("source-map-support");
const tokenAuth = require("./lib/token-auth");
const config = require("./lib/config");

// api authentication
const passport = tokenAuth.init();

let app = express();
app.use(passport.initialize());

// configure app
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// connect to database;
mongoose.Promise = global.Promise;
// noinspection JSUnresolvedFunction
mongoose.connect(`mongodb://${config.MONGODB_URL}/flash-channel`, {});
// noinspection JSUnresolvedVariable
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// add Source Map Support
SourceMapSupport.install();

// add Flash controller
app.use('/flash', flashRoutes);

// api token generation
app.post('/generate_token', authMiddleware(config.AUTH_USERNAME, config.AUTH_PASSWORD), tokenAuth.tokenRequestHandler);

// error handler
app.use(function (err, req, res) {
    console.log(err);
    res.status(400).json(err);
});

app.listen(config.PORT, function () {
    console.log(`Flash server listening on port ${config.PORT}`);
});
