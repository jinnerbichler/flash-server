const express = require("express");
const transfer = require("../iota.flash.js/lib/transfer");
const multisig = require("../iota.flash.js/lib/multisig");
const constants = require("../iota.flash.js/lib/constants");
const flashUtils = require("../flash-utils");
const IotaLib = require('iota.lib.js');
const validate = require('express-validation');
const schemas = require("./schemas");
const FlashChannel = require("../model/flash");
const DigestIndex = require("../model/digest-index");
const ChannelEvent = require("../model/channel-event");
const asyncMiddleware = require("../utils").asyncMiddleware;
const tokenAuth = require("../token-auth").middleware;
const config = require("../config");

const router = express.Router();
router.use(tokenAuth);

const SEED = config.IOTA_SEED;  // should never leave server!
const IRI_HOST = config.IRI_HOST;
const IRI_PORT = config.IRI_PORT;
const IRI_TESTNET = config.IRI_TESTNET || false;
const IRI_MIN_WEIGHT = IRI_TESTNET ? 13 : 18;
const IOTA = new IotaLib({'host': IRI_HOST, 'port': IRI_PORT});

// ensure binary tree
constants.MAX_USES = 2;

// noinspection JSUnusedLocalSymbols
router.post('/init', validate(schemas.init), asyncMiddleware(async (req, res, next) => {

    let initValues = req.body;
    console.log(`Initializing flash with ${JSON.stringify(initValues)}`);

    // check sum of deposits
    if (initValues.deposit.reduce((a, b) => a + b, 0) !== initValues.balance) {
        res.send(400, 'Deposits / balance mismatch');
        return;
    }

    // initialise flash object
    const lastIndex = await DigestIndex.getIndex();
    let flash = {
        userIndex: initValues.userIndex,
        index: lastIndex,
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

    // create digests for the entire tree + remainder address
    const numDigest = Math.pow(2, flash.depth + 1) - 1;
    for (let digestIndex = flash.index; digestIndex < numDigest + 1 + flash.index; digestIndex++) {
        // create new digest
        const digest = multisig.getDigest(SEED, digestIndex, flash.security);
        flash.partialDigests.push(digest);
    }

    // update global index
    const endIndex = await DigestIndex.setIndex(flash.index + flash.partialDigests.length);

    console.log(`Created ${flash.partialDigests.length} digest (index start: ${flash.index}, end: ${endIndex})`);

    // save flash channel
    let flashObj = await FlashChannel.create(flash);

    // create event
    await ChannelEvent.Model.create({
        type: ChannelEvent.ACTIONS.init,
        flash: flash,
        channel: flashObj._id,
        meta: initValues
    });

    console.log(`Initialized channel with Id ${flashObj.id}`);

    res.json({
        channelId: flashObj.id,
        flash: flash
    });
}));

// -------------------------------------------------
// ------- Generate Multisignature Addresses -------
// -------------------------------------------------
// noinspection JSUnusedLocalSymbols
router.post('/multisignature/:channelId', validate(schemas.multisignature), asyncMiddleware(async (req, res, next) => {

    let allDigests = req.body.allDigests;
    console.log(`Creating ${allDigests[0].length} multisignature addresses for ${allDigests.length} users`);

    const channelId = req.params.channelId;
    const flash = (await FlashChannel.getChannel(channelId)).data;
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

    let treeDigests = multisignatureAddresses.slice(0, flash.depth + 1);
    flash.flash.multisigDigestPool = multisignatureAddresses.slice(flash.depth + 1);

    // intitial tree
    for (let i = 1; i < treeDigests.length; i++)
        treeDigests[i - 1].children.push(treeDigests[i])

    // set deposit address
    flash.flash.depositAddress = IOTA.utils.addChecksum(treeDigests[0].address);

    // set Flash root
    flash.flash.root = treeDigests[0];

    // update flash index
    flash.index = treeDigests.length + 1;

    // update flash object
    let flashObj = await FlashChannel.updateChannel(channelId, {data: flash});

    // create event
    await ChannelEvent.Model.create({
        type: ChannelEvent.ACTIONS.multisignature,
        flash: flash,
        channel: flashObj._id,
        meta: allDigests
    });

    res.json(treeDigests)
}));

// -------------------------------------------------
// ----------- Set Settlement Addresses ------------
// -------------------------------------------------
// noinspection JSUnusedLocalSymbols
router.post('/settlement/:channelId', validate(schemas.settlement), asyncMiddleware(async (req, res, next) => {

    const settlementAddresses = req.body.settlementAddresses;
    console.log(`Adding ${settlementAddresses.length} settlement addresses: ${JSON.stringify(settlementAddresses)}`);

    let flash = (await FlashChannel.getChannel(req.params.channelId)).data;
    flash.flash.settlementAddresses = settlementAddresses;

    let flashObj = await FlashChannel.updateChannel(req.params.channelId, {data: flash});

    // create event
    await ChannelEvent.Model.create({
        type: ChannelEvent.ACTIONS.settmement,
        flash: flash,
        channel: flashObj._id,
        meta: settlementAddresses
    });

    res.json(flash);
}));

// -------------------------------------------------
// ------------ Create Transfer Bundles-------------
// -------------------------------------------------
// noinspection JSUnusedLocalSymbols
router.post('/transfer/:channelId', validate(schemas.transfer), asyncMiddleware(async (req, res, next) => {

    // ToDO: check each address if it is not the one in the flash object

    let transfers = req.body.transfers;
    console.log(`Bundling ${transfers.length} transfers`);

    // create transactions
    let flashObj = await FlashChannel.getChannel(req.params.channelId);
    let bundles = flashUtils.createTransaction(flashObj.data, transfers, false);

    // create event
    await ChannelEvent.Model.create({
        type: ChannelEvent.ACTIONS.transfer,
        flash: flashObj.data,
        channel: flashObj._id,
        meta: transfers
    });

    res.json(bundles);
}));

// -------------------------------------------------
// ----------------- Sign Transactions -------------
// -------------------------------------------------
// noinspection JSUnusedLocalSymbols
router.post('/sign/:channelId', validate(schemas.sign), asyncMiddleware(async (req, res, next) => {

    let bundles = req.body.bundles;
    console.log(`Signing ${bundles.length} transactions`);

    // update tree if neccesarry
    let flashObj = await FlashChannel.getChannel(req.params.channelId);
    flashUtils.updateTree(flashObj.data);
    await FlashChannel.updateChannel(req.params.channelId, {data: flashObj.data});

    // get signatures for the bundles
    let signatures = flashUtils.signTransaction(flashObj.data, SEED, bundles);

    // sign bundle with signatures
    let signedBundles = transfer.appliedSignatures(bundles, signatures);

    // create event
    await ChannelEvent.Model.create({
        type: ChannelEvent.ACTIONS.sign,
        flash: flashObj.data,
        channel: flashObj._id,
        meta: bundles
    });

    res.json(signedBundles);
}));

// -------------------------------------------------
// --------------- Apply Signed Bundles ------------
// -------------------------------------------------
// noinspection JSUnusedLocalSymbols
router.post('/apply/:channelId', validate(schemas.apply), asyncMiddleware(async (req, res, next) => {

    let signedBundles = req.body.signedBundles;
    console.log(`Applying ${signedBundles.length} signed bundles`);

    // apply transfers to user
    let flashObj = await FlashChannel.getChannel(req.params.channelId);
    let flash = flashUtils.applyTransfers(flashObj.data, signedBundles);

    // save latest channel bundles
    flash.bundles = signedBundles;
    flashObj = await FlashChannel.updateChannel(req.params.channelId, {data: flash});

    // create event
    await ChannelEvent.Model.create({
        type: ChannelEvent.ACTIONS.apply,
        flash: flashObj.data,
        channel: flashObj._id,
        meta: signedBundles
    });

    res.json(flash);
}));

// -------------------------------------------------
// ------------------ Close Channel ----------------
// -------------------------------------------------
// noinspection JSUnusedLocalSymbols
router.post('/close/:channelId', asyncMiddleware(async (req, res, next) => {

    console.log('Closing channel');

    let flashObj = await FlashChannel.getChannel(req.params.channelId);
    let bundles = flashUtils.createTransaction(flashObj.data, flashObj.data.flash.settlementAddresses, true);

    flashObj = await FlashChannel.updateChannel(req.params.channelId, {isClosed: true});

    // create event
    await ChannelEvent.Model.create({
        type: ChannelEvent.ACTIONS.close,
        flash: flashObj.data,
        channel: flashObj._id
    });

    res.json(bundles);
}));

// -------------------------------------------------
// ------------- Fund Channel-----------------
// -------------------------------------------------
// noinspection JSUnusedLocalSymbols
router.post('/fund/:channelId', asyncMiddleware(async (req, res, next) => {

    const flashObj = await FlashChannel.getChannel(req.params.channelId); // ToDo: validate flash object (e.g. multisignatures, settlement addresses, ...)
    const flash = flashObj.data;

    // create transfer object
    const transfers = [{
        'address': flash.flash.depositAddress,
        'value': flash.flash.deposit[flash.userIndex],
        'message': 'FLASH9FUND',
        'tag': 'FLASH'
    }];

    // initial transer
    console.log(`Funding channel: ${JSON.stringify(transfers)}`);
    IOTA.api.sendTransfer(SEED, flash.depth, IRI_MIN_WEIGHT, transfers, {}, async function (error, finalTransactions) {

        if (error != null)
            res.json(error);

        // create event
        await ChannelEvent.Model.create({
            type: ChannelEvent.ACTIONS.fund,
            flash: flashObj.data,
            channel: flashObj._id,
            meta: finalTransactions
        });

        res.json(finalTransactions);
    });
}));

// -------------------------------------------------
// ------------- Finalize Channel-----------------
// -------------------------------------------------
// noinspection JSUnusedLocalSymbols
router.post('/finalize/:channelId', asyncMiddleware(async (req, res, next) => {

    console.log(`Finalizing channel`);

    const flashObj = await FlashChannel.getChannel(req.params.channelId); // ToDo: validate flash object (e.g. multisignatures, settlement addresses, ...)
    const flash = flashObj.data;

    // validate bundles
    if (flash.bundles.length !== 1)
        res.status(401);

    // create trytes for bundle
    let bundleTrytes = [];
    const bundle = flash.bundles[0];
    bundle.forEach(function (tx) {
        bundleTrytes.push(IOTA.utils.transactionTrytes(tx))
    });
    bundleTrytes = bundleTrytes.reverse();

    // send trytes
    IOTA.api.sendTrytes(bundleTrytes, flash.depth, IRI_MIN_WEIGHT, {}, function (error, finalTransactions) {

        if (error != null) {
            console.log('Error while finalizing channel', error);
            res.json(error);
            return;
        }

        console.log('Sucessfully attached final trytes!');

        res.json({
            finalTransactions: finalTransactions,
            flash: flash
        });

        // // reset state
        // // ToDo: Set channel to closed state
        // FlashChannel.updateChannel(req.params.channelId, {data: flash, isFinalized: true}, false).then(() => {
        //
        //     // create event
        //     ChannelEvent.Model.create({
        //         type: ChannelEvent.ACTIONS.finalize,
        //         flash: flashObj.data,
        //         channel: flashObj._id,
        //         meta: finalTransactions
        //     }).then(() => {
        //     });
        // });
    });
}));

// -------------------------------------------------
// -------------- Get Settlement Address -----------
// -------------------------------------------------
// noinspection JSUnusedLocalSymbols
router.post('/settlement_address', asyncMiddleware(async (req, res, next) => {

    IOTA.api.getNewAddress(SEED, {
        total: 1,
        security: 2,
        checksum: false
    }, function (error, addresses) {

        if (error != null) {
            console.log('Error while generating address', error);
            res.json(error);
            return;
        }

        console.log(`Generated settlement address ${addresses[0]}`);
        res.json({address: addresses[0]});
    });

}));

// -------------------------------------------------
// -------------- Get Flash Object -----------------
// -------------------------------------------------
// noinspection JSUnusedLocalSymbols
router.get('/state/:channelId', asyncMiddleware(async (req, res, next) => {
    const channel = await FlashChannel.getChannel(req.params.channelId);
    res.json(channel.data);
}));

// -------------------------------------------------
// -------------- Get Balance ----------------------
// -------------------------------------------------
// noinspection JSUnusedLocalSymbols
router.get('/balance/:channelId', asyncMiddleware(async (req, res, next) => {
    const flash = (await FlashChannel.getChannel(req.params.channelId)).data;
    const balance = flash.flash.deposit[flash.userIndex];
    res.json({balance: balance});
}));


module.exports = {
    router: router
};