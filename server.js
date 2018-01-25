"use strict";
const express = require('express');
const bodyParser = require('body-parser');
const logger = require("morgan");
const methodOverride = require('method-override');
const path = require('path');
const mongoose = require('mongoose');
const restify = require('express-restify-mongoose');
const flashRoutes = require("./lib/controller/flash").router;
const authMiddleware = require("./lib/utils").authMiddleware;
const SourceMapSupport = require("source-map-support");
const tokenAuth = require("./lib/token-auth");
const config = require("./lib/config");
const flashModel = require("./lib/model/flash").Model;
const channelEventModel = require("./lib/model/channel-event").Model;

// api authentication
const passport = tokenAuth.init();

let app = express();
app.use(passport.initialize());

// configure app
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(methodOverride());
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

// frontend configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './public'));
app.use(express.static(path.join(__dirname, './public')));

app.get('/', function (req, res) {
    res.render('index')
});

// add Flash controller
app.use('/flash', flashRoutes);

// api token generation
app.post('/token', authMiddleware(config.AUTH_USERNAME, config.AUTH_PASSWORD), tokenAuth.tokenRequestHandler);

// set REST api for models
const router = express.Router();
restify.serve(router, flashModel);
restify.serve(router, channelEventModel);
app.use(router);

// error handler
app.use(function (err, req, res) {
    console.log(err);
    res.status(400).json(err);
});

app.listen(config.PORT, function () {
    console.log(`Flash server listening on port ${config.PORT}`);
});
