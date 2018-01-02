"use strict";
const express = require('express');
const bodyParser = require('body-parser');
const validate = require('express-validation');
const transfer = require("./lib/iota.flash.js/lib/transfer");
const multisig = require("./lib/iota.flash.js/lib/multisig");
const flashUtils = require("./lib/flash-utils");
const storage = require("./lib/storage");
const schemas = require("./lib/schemas");

const SEED = process.env.IOTA_SEED;  // should never leave server!

let app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// -------------------------------------------------
// -------------- Flash Intialisation --------------
// -------------------------------------------------
app.post('/init', validate(schemas.init), function (req, res) {

    let initValues = req.body;
    console.log(`Initializing flash with ${JSON.stringify(initValues)}`);

    // check sum of deposits
    if (initValues.deposit.reduce((a, b) => a + b, 0) !== initValues.balance) {
        res.send(400, 'Deposits / balance mismatch');
        return;
    }

    // initialise flash object
    let flash = {
        userIndex: initValues.userIndex,
        index: initValues.index,
        security: initValues.security,
        depth: initValues.depth,
        bundles: [],
        partialDigests: [],
        flash: {
            signersCount: initValues.signersCount,
            balance: initValues.balance,
            deposit: initValues.deposit,
            outputs: {},
            transfers: []
        }
    };

    // create digests for the start of the channel
    for (let i = 0; i < flash.depth + 1; i++) {

        // create new digest
        const digest = multisig.getDigest(SEED, flash.index, flash.security);

        // increment key index
        flash.index++;
        flash.partialDigests.push(digest);
    }

    storage.set('flash', flash);

    res.json(flash);
});

// -------------------------------------------------
// ------- Generate Multisignature Addresses -------
// -------------------------------------------------
app.post('/multisignature', validate(schemas.multisignature), function (req, res) {

    let allDigests = req.body.allDigests;
    console.log(`Creating ${allDigests[0].length} multisignature addresses for ${allDigests.length} users`);

    let flash = storage.get('flash');
    let multisignatureAddresses = flash.partialDigests.map((digest, index) => {
        // create address
        let addy = multisig.composeAddress(
            allDigests.map(userDigests => userDigests[index])
        );

        // add key index in
        addy.index = digest.index;

        // add the signing index to the object IMPORTANT
        addy.signingIndex = flash.userIndex * digest.security;

        // get the sum of all digest security to get address security sum
        addy.securitySum = allDigests
            .map(userDigests => userDigests[index])
            .reduce((acc, v) => acc + v.security, 0);

        // add Security
        addy.security = digest.security;
        return addy
    });

    // set remainder address (same for all users)
    flash.flash.remainderAddress = multisignatureAddresses.shift();

    // nest trees
    for (let i = 1; i < multisignatureAddresses.length; i++) {
        multisignatureAddresses[i - 1].children.push(multisignatureAddresses[i])
    }

    // set Flash root
    flash.flash.root = multisignatureAddresses.shift();

    // update flash object
    storage.set('flash', flash);

    res.json(multisignatureAddresses)
});

// -------------------------------------------------
// ----------- Set Settlement Addresses ------------
// -------------------------------------------------
app.post('/settlement', validate(schemas.settlement), function (req, res) {

    const settlementAddresses = req.body.settlementAddresses;
    console.log(`Adding ${settlementAddresses.length} settlement addresses`);

    let flash = storage.get('flash');
    flash.flash.settlementAddresses = settlementAddresses;
    storage.set('flash', flash);
    res.json(flash);
});

// -------------------------------------------------
// ------------ Create Transfer Bundles-------------
// -------------------------------------------------
app.post('/transfer', validate(schemas.transfer), function (req, res) {

    // ToDO: check each address if it is not the one in the flash object

    let transfers = req.body.transfers;
    console.log(`Bundling ${transfers.length} transfers`);

    let flash = storage.get('flash');
    let bundles = flashUtils.createTransaction(flash, transfers, false);

    res.json(bundles);
});

// -------------------------------------------------
// ----------------- Sign Transactions -------------
// -------------------------------------------------
app.post('/sign', validate(schemas.sign), function (req, res) {

    let bundles = req.body.bundles;
    console.log(`Signing ${bundles.length} transactions`);

    let flash = storage.get('flash');

    // get signatures for the bundles
    let signatures = flashUtils.signTransaction(flash, SEED, bundles);

    // sign bundle with signatures
    let signedBundles = transfer.appliedSignatures(bundles, signatures);

    res.json(signedBundles);
});

// -------------------------------------------------
// --------------- Apply Signed Bundles ------------
// -------------------------------------------------
app.post('/apply', validate(schemas.apply), function (req, res) {

    let signedBundles = req.body.signedBundles;
    console.log(`Applying ${signedBundles.length} signed bundles`);

    // apply transfers to user
    let flash = storage.get('flash');
    flash = flashUtils.applyTransfers(flash, signedBundles);

    // save latest channel bundles
    flash.bundles = signedBundles;
    storage.set('flash', flash);

    res.json(flash);
});

// -------------------------------------------------
// ------------------ Close Channel ----------------
// -------------------------------------------------
app.post('/close', function (req, res) {

    console.log('Closing channel');

    let flash = storage.get('flash');
    let bundles = flashUtils.createTransaction(flash, flash.flash.settlementAddresses, true);

    res.json(bundles);
});

// -------------------------------------------------
// -------------- Get Flash Object -----------------
// -------------------------------------------------
app.get('/flash', function (req, res) {
    res.json(storage.get('flash'));
});

// -------------------------------------------------
// -------------- Get Balance -----------------
// -------------------------------------------------
app.get('/balance', function (req, res) {
    const flash = storage.get('flash');
    const balance = flash.flash.deposit[flash.userIndex];
    res.json({balance: balance});
});

// error handler
app.use(function (err, req, res, next) {
    res.status(400).json(err);
    next();
});

app.listen(3000, function () {
    console.log('Flash server listening on port 3000!');
});